import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";

const body = z.object({ name: z.string().trim().max(80).optional(), locale: z.enum(["en", "am"]) }).strict();

export async function POST(request: Request) {
  const g = await guardBuilder({ mutating: true, limit: { name: "project-create", perHour: 10 } });
  if (!g.ok) return g.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const project = await g.builder.store.createProject(g.owner, { name: parsed.data.name || "", locale: parsed.data.locale });
  return json(201, { id: project.id });
}
