import "server-only";
import { reportError } from "@/lib/observability/report";
import { randomUUID } from "node:crypto";
import { keywordCheck } from "@/lib/safety/keywords";
import { runAgent, type AgentEvent, type AgentRunResult } from "@/lib/agent/loop";
import { agentSystemPrompt, userTurn } from "@/lib/agent/prompt";
import type { LLMProvider, MessageParam } from "@/lib/providers/llm/types";
import type { UsageLogger } from "@/lib/providers/llm/usage-log";
import type { Lock } from "@/lib/lock";
import type { AssetStore } from "@/lib/cloud/assets";
import { LazySiteSandbox } from "@/lib/providers/sandbox/lazy";
import type { SandboxProvider } from "@/lib/providers/sandbox/types";
import { templateFiles } from "@/lib/template/files";
import type { ChatMessage, ProjectStore } from "@/lib/projects/types";
import { biggerSize, DEFAULT_CAP_CENTS_PER_CREDIT, DEFAULT_FIRST_BUILD_CAP_CENTS, firstBuildCapNano, MAX_TURNS_BY_SIZE, sizeRank, type RequestSize } from "@/lib/billing/credits";
import type { LedgerMeta } from "@/lib/billing/store";
import type { RequestSizer } from "@/lib/agent/size";

/** Changes and cost cap per request size (from Admin → Settings). */
export interface SizePricing {
  sizeCredits: Record<RequestSize, number>;
  /** AI cost allowed per change charged, in US cents. */
  capCentsPerCredit: number;
  /** AI cost allowed for a free first build, in US cents (capped by MAX_FIRST_BUILD_CAP_CENTS). */
  firstBuildCapCents: number;
}

export interface BuilderDeps {
  store: ProjectStore;
  sandboxes: SandboxProvider;
  llm: LLMProvider;
  usage: UsageLogger;
  model: string;
  lock: Lock;
  assets?: AssetStore;
  /**
   * AI changes (credits); when set, each request costs the changes for its size, given back
   * if the change fails on our side.
   */
  credits?: {
    consume(userId: string, ref: string, n: number, meta?: LedgerMeta): Promise<boolean>;
    /** Returns how many changes were given back (fewer or none past the daily refund cap). */
    refund(userId: string, ref: string, n: number, meta?: LedgerMeta): Promise<unknown>;
    left?(userId: string): Promise<number>;
    /** True when this request is a free first build (a project with no saved version yet, within the monthly cap). */
    freeFirstBuild?(userId: string, ref: string): Promise<boolean>;
    /** Changes per size and the cost cap; without it every request is small (one change). */
    pricing?(): Promise<SizePricing>;
  };
  /** Sizes requests before they run; without it every request is small. */
  sizer?: RequestSizer;
}

/** Without admin settings: one change per request, no confirmation, the default cap. */
const ONE_CHANGE: SizePricing = { sizeCredits: { small: 1, medium: 1, large: 1 }, capCentsPerCredit: DEFAULT_CAP_CENTS_PER_CREDIT, firstBuildCapCents: DEFAULT_FIRST_BUILD_CAP_CENTS };

export type BuilderEvent =
  | AgentEvent
  | { type: "preview"; url: string }
  /** The site built and its new version is being saved (progress). */
  | { type: "saving" }
  /** A medium or large request waits for the owner's OK; nothing was charged or saved. */
  | { type: "needs_confirm"; size: RequestSize; cost: number; credits: number }
  | {
      type: "done";
      message: ChatMessage;
      previewUrl: string;
      siteName?: string;
      credits?: number;
      /** Changes this request used after any refund (0 for a free first build or a refunded failure). */
      charged?: number;
      size?: RequestSize;
      /** The request stopped at its cost cap: done in part (changed) or not at all (failed). */
      tooBig?: boolean;
    }
  /** no_credits: fewer changes left than this request needs (`cost`), or none at all. */
  | { type: "error"; code: "busy" | "not_found" | "failed" | "no_credits" | "blocked"; credits?: number; cost?: number };

const HISTORY_MESSAGES = 8;
/** Longer than the longest agent run (route maxDuration is 300 s). */
const LOCK_TTL_MS = 6 * 60_000;

/** Short plain-text history so the agent knows what was asked before (no tool transcripts). */
function historyFrom(messages: ChatMessage[]): MessageParam[] {
  const recent = messages.slice(-HISTORY_MESSAGES);
  const out: MessageParam[] = [];
  for (const m of recent) {
    const role = m.role === "owner" ? "user" : "assistant";
    const text = m.role === "owner" ? `<owner_message>\n${m.text}\n</owner_message>` : m.text || "(no reply)";
    const last = out.at(-1);
    if (last && last.role === role && typeof last.content === "string") last.content += `\n\n${text}`;
    else out.push({ role, content: text });
  }
  // The API needs the conversation to start with a user turn and alternate.
  while (out[0]?.role === "assistant") out.shift();
  if (out.at(-1)?.role === "user") out.push({ role: "assistant", content: "(no reply)" });
  return out;
}

/** Reads the business name from site.json so the project list shows it. */
export function siteName(siteJson: string, locale: "en" | "am"): string | null {
  try {
    const name = (JSON.parse(siteJson) as { name?: { en?: unknown; am?: unknown } }).name ?? {};
    const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null);
    return pick(name[locale]) ?? pick(name[locale === "en" ? "am" : "en"]);
  } catch {
    return null;
  }
}

let starter: string | null = null;
function starterSiteJson(): string {
  starter ??= String(templateFiles().find((f) => f.path === "src/site.json")?.content ?? "");
  return starter;
}

/** A short description for the owner's history of changes. */
const historyNote = (text: string) => {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > 80 ? `${one.slice(0, 79)}…` : one;
};

export async function sendOwnerMessage(
  deps: BuilderDeps,
  input: {
    ownerId: string;
    projectId: string;
    text: string;
    languages?: ("en" | "am")[];
    onEvent: (e: BuilderEvent) => void;
    signal?: AbortSignal;
    /** The size the owner agreed to pay for; the server sizes the request again and never charges less than it finds. */
    confirmSize?: RequestSize;
    /** The changes the owner agreed to pay; if the request now costs more (settings changed), it asks again. */
    confirmCost?: number;
  },
): Promise<void> {
  const { store } = deps;
  const project = await store.getProject(input.ownerId, input.projectId);
  if (!project) return input.onEvent({ type: "error", code: "not_found" });
  // Clearly harmful requests (phishing, scams...) never reach the agent and cost no credit.
  if (keywordCheck(input.text).length) return input.onEvent({ type: "error", code: "blocked" });
  const token = await deps.lock.acquire(`project:${project.id}`, LOCK_TTL_MS);
  if (!token) return input.onEvent({ type: "error", code: "busy" });
  let chargedRef: string | null = null;
  let chargedN = 0;
  try {
    // Charge first: an unpaid request is never saved, so it can't ride along in later history.
    const ref = randomUUID();
    const [previous, latest, photoList] = await Promise.all([
      store.listMessages(input.ownerId, project.id, 50),
      store.latestVersion(input.ownerId, project.id),
      deps.assets?.list(input.ownerId, project.id),
    ]);
    // A site's first build is free (one per site the plan allows, each month), even with no changes left.
    // Held per owner: requests on different projects can't race past the monthly cap.
    let free = false;
    if (!latest && deps.credits?.freeFirstBuild) {
      const fb = await deps.lock.acquire(`first-build:${input.ownerId}`, 30_000);
      if (fb) {
        try {
          free = await deps.credits.freeFirstBuild(input.ownerId, ref);
        } finally {
          await deps.lock.release(`first-build:${input.ownerId}`, fb);
        }
      }
    }
    // Size the request (skipped for a free first build: it costs nothing whatever its size).
    const pricing = (await deps.credits?.pricing?.()) ?? ONE_CHANGE;
    let size: RequestSize = "small";
    if (!free && deps.credits) {
      size = deps.sizer ? await deps.sizer.size(input.text, { userId: input.ownerId, projectId: project.id }).catch(() => "small" as const) : "small";
      // Building a site that has no version yet is never a small job.
      if (!latest) size = biggerSize(size, "medium");
    }
    const cost = free || !deps.credits ? 0 : pricing.sizeCredits[size];
    // A bigger request that costs more than a small one waits for the owner's OK.
    if (size !== "small" && cost > pricing.sizeCredits.small) {
      const left = (await deps.credits?.left?.(input.ownerId).catch(() => undefined)) ?? 0;
      // Never more than the owner has, and never more than one change without asking first.
      if (left < cost) return input.onEvent({ type: "error", code: "no_credits", credits: left, cost });
      const agreed = input.confirmSize && sizeRank(input.confirmSize) >= sizeRank(size) && input.confirmCost !== undefined && input.confirmCost >= cost;
      if (!agreed) return input.onEvent({ type: "needs_confirm", size, cost, credits: left });
    }
    const meta: LedgerMeta = { size, note: historyNote(input.text) };
    const paid = free || (deps.credits ? await deps.credits.consume(input.ownerId, ref, cost, meta) : true);
    if (!paid) {
      const left = (await deps.credits?.left?.(input.ownerId).catch(() => undefined)) ?? 0;
      return input.onEvent({ type: "error", code: "no_credits", credits: left, ...(cost > 1 ? { cost } : {}) });
    }
    chargedRef = deps.credits && !free ? ref : null;
    chargedN = chargedRef ? cost : 0;
    const refund = () => deps.credits?.refund(input.ownerId, ref, cost, meta);
    await store.addMessage(input.ownerId, { projectId: project.id, role: "owner", text: input.text });

    // Boot the sandbox while the model reads the request; tools wait for it.
    const photos = photoList ?? [];
    const opening = deps.sandboxes.open(project.id, latest?.files ?? null).then(async (sb) => {
      if (deps.assets && photos.length) await sb.writeAssets(await deps.assets.files(input.ownerId, project.id));
      return sb;
    });
    opening.then((sb) => input.onEvent({ type: "preview", url: sb.previewUrl })).catch(() => undefined);
    const lazy = new LazySiteSandbox(opening, project.id);
    const siteJson = latest?.files["src/site.json"] ?? starterSiteJson();

    const result = await runAgent({
      llm: deps.llm,
      workspace: lazy,
      system: agentSystemPrompt(),
      history: historyFrom(previous),
      userContent: userTurn(input.text, siteJson, photos, input.languages),
      model: deps.model,
      usage: deps.usage,
      context: { userId: input.ownerId, projectId: project.id },
      // Progress only: the model's streamed words (working notes like "#B85C7A (contrast vs …)")
      // never leave the server; the owner gets the final reply with "done".
      onEvent: (e) => {
        if (e.type !== "text") input.onEvent(e);
      },
      signal: input.signal,
      // Changing an existing site is usually small: less thinking costs less (measured in evals).
      effort: latest ? "low" : "medium",
      // Spending follows what the owner pays: a cap per change charged (free first builds have their own).
      budgetNanoUsd: free ? firstBuildCapNano(pricing) : deps.credits ? cost * pricing.capCentsPerCredit * 10_000_000 : undefined,
      // A free build is the one anyone can start: its cap holds even if the prompt cache missed.
      strictBudget: free,
      maxTurns: MAX_TURNS_BY_SIZE[free || !latest ? "first_build" : size],
    });

    const sandbox = await opening;
    let versionNumber: number | undefined;
    // Sent back so the builder can show the site's new name straight away.
    let siteNameNow: string | undefined;
    if (result.status === "changed") {
      input.onEvent({ type: "saving" });
      const version = await store.addVersion(input.ownerId, {
        projectId: project.id,
        summary: input.text.slice(0, 140),
        files: await sandbox.snapshotFiles(),
      });
      versionNumber = version.number;
      if (!project.name) {
        const name = siteName(version.files["src/site.json"] ?? "", project.locale);
        if (name) {
          await store.renameProject(input.ownerId, project.id, name);
          siteNameNow = name;
        }
      }
    }
    // Refund failures on our side, and answers that changed nothing (a clarifying question: no
    // file written, no build); not runs the owner walked away from, and not requests too big for
    // their budget (the AI work was done and paid for; the owner is told to split it). Refunds
    // keep the daily cap (lib/billing), so a stream of questions can't run the AI for free.
    let charged = chargedRef ? cost : 0;
    if (chargedRef && !input.signal?.aborted && !result.stoppedForBudget && costsNothing(result)) {
      charged = Math.max(0, cost - givenBack(await refund(), cost));
      chargedRef = null;
    }
    const message = await store.addMessage(input.ownerId, {
      projectId: project.id,
      role: "assistant",
      text: result.reply,
      status: result.status,
      versionNumber,
    });
    input.onEvent({
      type: "done",
      message,
      previewUrl: sandbox.previewUrl,
      ...(siteNameNow ? { siteName: siteNameNow } : {}),
      ...(deps.credits ? { charged, size } : {}),
      ...(result.stoppedForBudget ? { tooBig: true } : {}),
      ...(await creditsAfter(deps, input.ownerId)),
    });
    chargedRef = null;
  } catch (error) {
    reportError("builder.sendOwnerMessage failed", error, { projectId: project.id });
    if (chargedRef && !input.signal?.aborted) await deps.credits?.refund(input.ownerId, chargedRef, chargedN).catch(() => undefined);
    input.onEvent({ type: "error", code: "failed", ...(await creditsAfter(deps, input.ownerId)) });
  } finally {
    await deps.lock.release(`project:${project.id}`, token);
  }
}

/** A run that charges nothing: it failed on our side, or only answered (no file written, no build). */
export function costsNothing(result: Pick<AgentRunResult, "status" | "built" | "changedPaths">): boolean {
  if (result.status === "failed") return true;
  return result.status === "answered" && result.changedPaths.length === 0 && !result.built;
}

/** How many changes a refund gave back: a count, or true/false from older refund functions. */
function givenBack(r: unknown, asked: number): number {
  if (typeof r === "number") return Math.max(0, Math.min(asked, r));
  return r === false ? 0 : asked;
}

/** The owner's AI changes left after this request (refunds included), sent with the last event. */
async function creditsAfter(deps: BuilderDeps, ownerId: string): Promise<{ credits?: number }> {
  const n = await deps.credits?.left?.(ownerId).catch(() => undefined);
  return typeof n === "number" ? { credits: n } : {};
}

/** Puts an older version back as a new version (history is never rewritten). */
export async function restoreVersion(deps: BuilderDeps, input: { ownerId: string; projectId: string; number: number }) {
  const version = await deps.store.getVersion(input.ownerId, input.projectId, input.number);
  if (!version) return null;
  const token = await deps.lock.acquire(`project:${input.projectId}`, LOCK_TTL_MS);
  if (!token) return null;
  try {
    const sandbox = await deps.sandboxes.open(input.projectId, version.files);
    const build = await sandbox.runBuild();
    if (!build.ok) return null;
    return await deps.store.addVersion(input.ownerId, {
      projectId: input.projectId,
      summary: `restore:${version.number}`,
      files: version.files,
    });
  } finally {
    await deps.lock.release(`project:${input.projectId}`, token);
  }
}
