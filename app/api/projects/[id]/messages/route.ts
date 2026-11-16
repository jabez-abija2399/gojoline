import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";
import { sendOwnerMessage, type BuilderEvent } from "@/lib/builder/service";

export const maxDuration = 300;

const body = z
  .object({
    text: z.string().trim().min(1).max(4000),
    /** Chosen before the first build: which languages the site should have. */
    languages: z.array(z.enum(["en", "am"])).min(1).max(2).refine((l) => new Set(l).size === l.length).optional(),
    /** Sent again after "Go ahead": the size the owner agreed to. The server sizes the request itself. */
    confirmSize: z.enum(["medium", "large"]).optional(),
  })
  .strict();
const idSchema = z.uuid();

/** Streams agent progress as newline-delimited JSON events. */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/messages">) {
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return json(404, { error: "not_found" });
  const g = await guardBuilder({ mutating: true, limit: { name: "ai-message", perHour: 40 } });
  if (!g.ok) return g.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  if (!(await g.builder.store.getProject(g.owner, id))) return json(404, { error: "not_found" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: BuilderEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      await sendOwnerMessage(g.builder, { ownerId: g.owner, projectId: id, text: parsed.data.text, languages: parsed.data.languages, confirmSize: parsed.data.confirmSize, onEvent: send, signal: request.signal });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
