import { z } from "zod";
import type { ToolDefinition } from "@/lib/providers/llm/types";
import { MAX_FILE_BYTES, checkReadPath, checkWritePath, type BuildResult, type Workspace } from "./workspace";

const schemas = {
  list_files: z.object({}).strict(),
  read_file: z.object({ path: z.string().min(1).max(200) }).strict(),
  write_file: z.object({ path: z.string().min(1).max(200), content: z.string().max(MAX_FILE_BYTES) }).strict(),
  search_replace: z
    .object({
      path: z.string().min(1).max(200),
      old_string: z.string().min(1).max(MAX_FILE_BYTES),
      new_string: z.string().max(MAX_FILE_BYTES),
    })
    .strict(),
  run_build: z.object({}).strict(),
} as const;

export type ToolName = keyof typeof schemas;

const descriptions: Record<ToolName, string> = {
  list_files: "List the project's files.",
  read_file: "Read a file. Use before editing any file other than src/site.json (whose current content you already have).",
  write_file:
    "Create or fully replace a file. Prefer search_replace for small edits to existing files; use write_file for new files or when most of a file changes.",
  search_replace:
    "Replace one exact occurrence of old_string with new_string in a file. old_string must match the file exactly (including indentation) and occur exactly once; include enough surrounding lines to make it unique.",
  run_build:
    "Type-check, validate src/site.json and build the site. Run after your edits; fix every reported problem, then run it again.",
};

export const agentTools: ToolDefinition[] = (Object.keys(schemas) as ToolName[]).map((name) => {
  const json = z.toJSONSchema(schemas[name]) as Record<string, unknown>;
  delete json.$schema;
  return {
    name,
    description: descriptions[name],
    input_schema: json as ToolDefinition["input_schema"],
  };
});

export interface ToolOutcome {
  content: string;
  isError: boolean;
  /** Set when the tool ran a build. */
  build?: BuildResult;
  /** Set when a file changed. */
  changedPath?: string;
}

const MAX_TOOL_OUTPUT = 12_000;

function clip(text: string): string {
  return text.length > MAX_TOOL_OUTPUT ? `${text.slice(0, MAX_TOOL_OUTPUT)}\n[... ${text.length - MAX_TOOL_OUTPUT} more characters]` : text;
}

/** Validates the model's tool input and runs it against the workspace. Never throws. */
export async function runTool(name: string, rawInput: unknown, ws: Workspace): Promise<ToolOutcome> {
  if (!(name in schemas)) return { content: `Unknown tool: ${name}`, isError: true };
  const parsed = schemas[name as ToolName].safeParse(rawInput);
  if (!parsed.success) {
    return { content: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`, isError: true };
  }
  const input = parsed.data as Record<string, string>;
  try {
    switch (name as ToolName) {
      case "list_files":
        return { content: (await ws.listFiles()).join("\n"), isError: false };
      case "read_file": {
        const check = checkReadPath(input.path!);
        if (!check.ok) return { content: check.reason, isError: true };
        const content = await ws.readFile(check.path);
        return content === null ? { content: `File not found: ${check.path}`, isError: true } : { content: clip(content), isError: false };
      }
      case "write_file": {
        const check = checkWritePath(input.path!);
        if (!check.ok) return { content: check.reason, isError: true };
        await ws.writeFile(check.path, input.content!);
        return { content: `Wrote ${check.path} (${input.content!.length} characters).`, isError: false, changedPath: check.path };
      }
      case "search_replace": {
        const check = checkWritePath(input.path!);
        if (!check.ok) return { content: check.reason, isError: true };
        const current = await ws.readFile(check.path);
        if (current === null) return { content: `File not found: ${check.path}`, isError: true };
        const count = current.split(input.old_string!).length - 1;
        if (count === 0) return { content: `old_string not found in ${check.path}. Read the file and copy the text exactly.`, isError: true };
        if (count > 1) return { content: `old_string occurs ${count} times in ${check.path}; include more surrounding text so it is unique.`, isError: true };
        const next = current.replace(input.old_string!, () => input.new_string!);
        if (next.length > MAX_FILE_BYTES) return { content: "Resulting file is too large.", isError: true };
        await ws.writeFile(check.path, next);
        return { content: `Edited ${check.path}.`, isError: false, changedPath: check.path };
      }
      case "run_build": {
        const build = await ws.runBuild();
        return {
          content: build.ok ? "Build succeeded. The preview is up to date." : `Build failed:\n${clip(build.output)}`,
          isError: !build.ok,
          build,
        };
      }
    }
  } catch (error) {
    return { content: `Tool failed: ${error instanceof Error ? error.message : "unknown error"}`, isError: true };
  }
}
