import "server-only";
import { reportError } from "@/lib/observability/report";
import { randomUUID } from "node:crypto";
import { keywordCheck } from "@/lib/safety/keywords";
import { runAgent, type AgentEvent } from "@/lib/agent/loop";
import { agentSystemPrompt, userTurn } from "@/lib/agent/prompt";
import type { LLMProvider, MessageParam } from "@/lib/providers/llm/types";
import type { UsageLogger } from "@/lib/providers/llm/usage-log";
import type { Lock } from "@/lib/lock";
import type { AssetStore } from "@/lib/cloud/assets";
import { LazySiteSandbox } from "@/lib/providers/sandbox/lazy";
import type { SandboxProvider } from "@/lib/providers/sandbox/types";
import { templateFiles } from "@/lib/template/files";
import type { ChatMessage, ProjectStore } from "@/lib/projects/types";

export interface BuilderDeps {
  store: ProjectStore;
  sandboxes: SandboxProvider;
  llm: LLMProvider;
  usage: UsageLogger;
  model: string;
  lock: Lock;
  assets?: AssetStore;
  /** AI edit credits; when set, each request costs one credit, refunded if the change fails. */
  credits?: { consume(userId: string, ref: string): Promise<boolean>; refund(userId: string, ref: string): Promise<unknown>; left?(userId: string): Promise<number> };
}

export type BuilderEvent =
  | AgentEvent
  | { type: "preview"; url: string }
  | { type: "done"; message: ChatMessage; previewUrl: string; siteName?: string; credits?: number }
  | { type: "error"; code: "busy" | "not_found" | "failed" | "no_credits" | "blocked"; credits?: number };

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

export async function sendOwnerMessage(
  deps: BuilderDeps,
  input: { ownerId: string; projectId: string; text: string; languages?: ("en" | "am")[]; onEvent: (e: BuilderEvent) => void; signal?: AbortSignal },
): Promise<void> {
  const { store } = deps;
  const project = await store.getProject(input.ownerId, input.projectId);
  if (!project) return input.onEvent({ type: "error", code: "not_found" });
  // Clearly harmful requests (phishing, scams...) never reach the agent and cost no credit.
  if (keywordCheck(input.text).length) return input.onEvent({ type: "error", code: "blocked" });
  const token = await deps.lock.acquire(`project:${project.id}`, LOCK_TTL_MS);
  if (!token) return input.onEvent({ type: "error", code: "busy" });
  let chargedRef: string | null = null;
  try {
    // Charge first: an unpaid request is never saved, so it can't ride along in later history.
    const ref = randomUUID();
    const [paid, previous, latest, photoList] = await Promise.all([
      deps.credits ? deps.credits.consume(input.ownerId, ref) : true,
      store.listMessages(input.ownerId, project.id, 50),
      store.latestVersion(input.ownerId, project.id),
      deps.assets?.list(input.ownerId, project.id),
    ]);
    if (!paid) return input.onEvent({ type: "error", code: "no_credits", credits: 0 });
    chargedRef = deps.credits ? ref : null;
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
      onEvent: input.onEvent,
      signal: input.signal,
      // Changing an existing site is usually small: less thinking costs less (measured in evals).
      effort: latest ? "low" : "medium",
    });

    const sandbox = await opening;
    let versionNumber: number | undefined;
    // Sent back so the builder can show the site's new name straight away.
    let siteNameNow: string | undefined;
    if (result.status === "changed") {
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
    // Refund failures on our side, not runs the owner walked away from.
    if (result.status === "failed" && chargedRef && !input.signal?.aborted) {
      await deps.credits?.refund(input.ownerId, chargedRef);
      chargedRef = null;
    }
    const message = await store.addMessage(input.ownerId, {
      projectId: project.id,
      role: "assistant",
      text: result.reply,
      status: result.status,
      versionNumber,
    });
    input.onEvent({ type: "done", message, previewUrl: sandbox.previewUrl, ...(siteNameNow ? { siteName: siteNameNow } : {}), ...(await creditsAfter(deps, input.ownerId)) });
    chargedRef = null;
  } catch (error) {
    reportError("builder.sendOwnerMessage failed", error, { projectId: project.id });
    if (chargedRef && !input.signal?.aborted) await deps.credits?.refund(input.ownerId, chargedRef).catch(() => undefined);
    input.onEvent({ type: "error", code: "failed", ...(await creditsAfter(deps, input.ownerId)) });
  } finally {
    await deps.lock.release(`project:${project.id}`, token);
  }
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
