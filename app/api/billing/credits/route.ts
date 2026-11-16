import { guardBuilder, json } from "@/lib/api/guard";
import { services } from "@/lib/server/services";

/** How many AI changes the signed-in owner has left (the builder shows it by the message box). */
export async function GET() {
  const g = await guardBuilder({ mutating: false, limit: { name: "credits", perHour: 600 } });
  if (!g.ok) return g.response;
  return json(200, { credits: await services().billing.creditsLeft(g.owner) });
}
