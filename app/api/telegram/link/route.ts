import { z } from "zod";
import { guardBuilder, json } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { services } from "@/lib/server/services";

async function setup(mutating: boolean) {
  const g = await guardBuilder({ mutating, limit: mutating ? { name: "tg-link", perHour: 20 } : undefined });
  if (!g.ok) return { error: g.response } as const;
  const user = await currentUser();
  const telegram = services().telegram;
  if (!user || !telegram) return { error: json(503, { error: "unavailable" }) } as const;
  return { user, telegram } as const;
}

export async function GET() {
  const s = await setup(false);
  if ("error" in s) return s.error;
  const link = await s.telegram.store.byUser(s.user.id);
  return json(200, { linked: !!link, username: link?.username ?? null });
}

const body = z.object({ locale: z.enum(["en", "am"]) }).strict();

/** Creates a one-time deep link: t.me/<bot>?start=<code>. */
export async function POST(request: Request) {
  const s = await setup(true);
  if ("error" in s) return s.error;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const code = await s.telegram.store.createLinkCode(s.user.id, parsed.data.locale);
  return json(200, { url: `https://t.me/${s.telegram.username}?start=${code}` });
}

export async function DELETE() {
  const s = await setup(true);
  if ("error" in s) return s.error;
  await s.telegram.store.unlink(s.user.id);
  return json(200, { ok: true });
}
