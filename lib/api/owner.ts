import "server-only";
import { z } from "zod";
import { currentUser, type CurrentUser } from "@/lib/auth/session";
import { services } from "@/lib/server/services";
import { guardBuilder, json } from "./guard";

type Ok = { ok: true; user: CurrentUser; builder: NonNullable<ReturnType<typeof services>["builder"]> };

/** Common checks for owner dashboard routes: valid id, signed in, CSRF, limits, project owned. */
export async function ownerRoute(id: string, opts: { mutating: boolean; limit?: { name: string; perHour: number } }): Promise<Ok | { ok: false; response: Response }> {
  if (!z.uuid().safeParse(id).success) return { ok: false, response: json(404, { error: "not_found" }) };
  const g = await guardBuilder(opts);
  if (!g.ok) return { ok: false, response: g.response };
  const user = await currentUser();
  if (!user || !(await g.builder.store.getProject(user.id, id))) return { ok: false, response: json(404, { error: "not_found" }) };
  return { ok: true, user, builder: g.builder };
}
