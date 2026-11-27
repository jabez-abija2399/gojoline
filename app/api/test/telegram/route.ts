import { NextResponse } from "next/server";
import { z } from "zod";
import { testRoutesOpen } from "@/lib/server/test-routes";
import { currentUser } from "@/lib/auth/session";
import { services } from "@/lib/server/services";

const query = z.object({ chatId: z.string().regex(/^-?\d{1,20}$/) });

/**
 * e2e only: what the stand-in Telegram bot sent to one chat, so tests can see whether an alert
 * went out. 404 everywhere else (same rule as /api/test/answers).
 */
export async function GET(request: Request) {
  if (!testRoutesOpen()) return new NextResponse(null, { status: 404 });
  const user = await currentUser();
  const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  // The e2e stand-in client keeps what it sent (MemoryTelegramClient.sent).
  const client = services().telegram?.client as { sent?: { chatId: string; html: string }[] } | undefined;
  if (!user || !parsed.success || !client?.sent) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ sent: client.sent.filter((m) => m.chatId === parsed.data.chatId).map((m) => m.html) });
}
