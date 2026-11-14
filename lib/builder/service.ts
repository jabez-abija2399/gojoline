import "server-only";
import { runAgent, type AgentEvent } from "@/lib/agent/loop";
import { agentSystemPrompt, userTurn } from "@/lib/agent/prompt";
import type { LLMProvider, MessageParam } from "@/lib/providers/llm/types";
import type { UsageLogger } from "@/lib/providers/llm/usage-log";
import type { SandboxProvider } from "@/lib/providers/sandbox/types";
import type { ChatMessage, ProjectStore } from "@/lib/projects/types";

export interface BuilderDeps {
  store: ProjectStore;
  sandboxes: SandboxProvider;
  llm: LLMProvider;
  usage: UsageLogger;
  model: string;
}

export type BuilderEvent =
  | AgentEvent
  | { type: "preview"; url: string }
  | { type: "done"; message: ChatMessage; previewUrl: string }
  | { type: "error"; code: "busy" | "not_found" | "failed" };

const HISTORY_MESSAGES = 8;
const running = new Set<string>();

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

export async function sendOwnerMessage(
  deps: BuilderDeps,
  input: { ownerId: string; projectId: string; text: string; onEvent: (e: BuilderEvent) => void; signal?: AbortSignal },
): Promise<void> {
  const { store } = deps;
  const project = await store.getProject(input.ownerId, input.projectId);
  if (!project) return input.onEvent({ type: "error", code: "not_found" });
  if (running.has(project.id)) return input.onEvent({ type: "error", code: "busy" });
  running.add(project.id);
  try {
    const previous = await store.listMessages(input.ownerId, project.id, 50);
    await store.addMessage(input.ownerId, { projectId: project.id, role: "owner", text: input.text });

    const latest = await store.latestVersion(input.ownerId, project.id);
    const sandbox = await deps.sandboxes.open(project.id, latest?.files ?? null);
    input.onEvent({ type: "preview", url: sandbox.previewUrl });

    const result = await runAgent({
      llm: deps.llm,
      workspace: sandbox,
      system: agentSystemPrompt(),
      history: historyFrom(previous),
      userContent: userTurn(input.text, await sandbox.readFile("src/site.ts")),
      model: deps.model,
      usage: deps.usage,
      context: { userId: input.ownerId, projectId: project.id },
      onEvent: input.onEvent,
      signal: input.signal,
    });

    let versionNumber: number | undefined;
    if (result.status === "changed") {
      const version = await store.addVersion(input.ownerId, {
        projectId: project.id,
        summary: input.text.slice(0, 140),
        files: await sandbox.snapshotFiles(),
      });
      versionNumber = version.number;
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
    running.delete(project.id);
  }
}

/** Puts an older version back as a new version (history is never rewritten). */
export async function restoreVersion(deps: BuilderDeps, input: { ownerId: string; projectId: string; number: number }) {
  const version = await deps.store.getVersion(input.ownerId, input.projectId, input.number);
  if (!version) return null;
  const sandbox = await deps.sandboxes.open(input.projectId, version.files);
  const build = await sandbox.runBuild();
  if (!build.ok) return null;
  return deps.store.addVersion(input.ownerId, {
    projectId: input.projectId,
    summary: `restore:${version.number}`,
    files: version.files,
  });
}
