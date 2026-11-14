import "server-only";
import { runAgent, type AgentEvent } from "@/lib/agent/loop";
import { agentSystemPrompt, userTurn } from "@/lib/agent/prompt";
import type { LLMProvider, MessageParam } from "@/lib/providers/llm/types";
import type { UsageLogger } from "@/lib/providers/llm/usage-log";
import type { Lock } from "@/lib/lock";
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
}

export type BuilderEvent =
  | AgentEvent
  | { type: "preview"; url: string }
  | { type: "done"; message: ChatMessage; previewUrl: string }
  | { type: "error"; code: "busy" | "not_found" | "failed" };

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

/** Reads the business name from site.ts so the project list shows it. */
export function siteName(siteTs: string, locale: "en" | "am"): string | null {
  const block = /\bname:\s*\{([^}]*)\}/.exec(siteTs)?.[1] ?? "";
  const pick = (lang: string) => new RegExp(`\\b${lang}:\\s*"([^"\\n]{1,80})"`).exec(block)?.[1];
  return pick(locale) ?? pick(locale === "en" ? "am" : "en") ?? null;
}

let starter: string | null = null;
function starterSiteTs(): string {
  starter ??= String(templateFiles().find((f) => f.path === "src/site.ts")?.content ?? "");
  return starter;
}

export async function sendOwnerMessage(
  deps: BuilderDeps,
  input: { ownerId: string; projectId: string; text: string; onEvent: (e: BuilderEvent) => void; signal?: AbortSignal },
): Promise<void> {
  const { store } = deps;
  const project = await store.getProject(input.ownerId, input.projectId);
  if (!project) return input.onEvent({ type: "error", code: "not_found" });
  const token = await deps.lock.acquire(`project:${project.id}`, LOCK_TTL_MS);
  if (!token) return input.onEvent({ type: "error", code: "busy" });
  try {
    const previous = await store.listMessages(input.ownerId, project.id, 50);
    await store.addMessage(input.ownerId, { projectId: project.id, role: "owner", text: input.text });

    const latest = await store.latestVersion(input.ownerId, project.id);
    // Boot the sandbox while the model reads the request; tools wait for it.
    const opening = deps.sandboxes.open(project.id, latest?.files ?? null);
    opening.then((sb) => input.onEvent({ type: "preview", url: sb.previewUrl })).catch(() => undefined);
    const lazy = new LazySiteSandbox(opening, project.id);
    const siteTs = latest?.files["src/site.ts"] ?? starterSiteTs();

    const result = await runAgent({
      llm: deps.llm,
      workspace: lazy,
      system: agentSystemPrompt(),
      history: historyFrom(previous),
      userContent: userTurn(input.text, siteTs),
      model: deps.model,
      usage: deps.usage,
      context: { userId: input.ownerId, projectId: project.id },
      onEvent: input.onEvent,
      signal: input.signal,
    });

    const sandbox = await opening;
    let versionNumber: number | undefined;
    if (result.status === "changed") {
      const version = await store.addVersion(input.ownerId, {
        projectId: project.id,
        summary: input.text.slice(0, 140),
        files: await sandbox.snapshotFiles(),
      });
      versionNumber = version.number;
      if (!project.name) {
        const name = siteName(version.files["src/site.ts"] ?? "", project.locale);
        if (name) await store.renameProject(input.ownerId, project.id, name);
      }
    }
    const message = await store.addMessage(input.ownerId, {
      projectId: project.id,
      role: "assistant",
      text: result.reply,
      status: result.status,
      versionNumber,
    });
    input.onEvent({ type: "done", message, previewUrl: sandbox.previewUrl });
  } catch (error) {
    console.error("builder.sendOwnerMessage failed", error instanceof Error ? error.message : "unknown");
    input.onEvent({ type: "error", code: "failed" });
  } finally {
    await deps.lock.release(`project:${project.id}`, token);
  }
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
