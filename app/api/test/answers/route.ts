import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { formDef } from "@/lib/cloud/forms";
import { services } from "@/lib/server/services";

const body = z.object({ projectId: z.uuid(), count: z.number().int().min(1).max(20) }).strict();

/**
 * e2e only: adds sample form answers to the signed-in owner's own published site, as if
 * visitors had sent a booking. 404 everywhere else (same rule as /api/test/otp).
 */
export async function POST(request: Request) {
  // Never against a real database: it replaces the site's forms with a sample one.
  if (process.env.E2E !== "1" || process.env.VERCEL === "1" || process.env.DATABASE_URL) return new NextResponse(null, { status: 404 });
  const user = await currentUser();
  const parsed = body.safeParse(await request.json().catch(() => null));
  const svc = services();
  if (!user || !parsed.success || !svc.cloud || !svc.publish) return new NextResponse(null, { status: 404 });
  const owned = await svc.publish.sites.getByProject(user.id, parsed.data.projectId);
  const site = owned && (await svc.cloud.publicSite(parsed.data.projectId));
  if (!site || site.ownerId !== user.id || owned.status !== "published") return new NextResponse(null, { status: 404 });
  const form = formDef.parse({
    type: "form",
    id: "booking",
    kind: "booking",
    heading: { en: "Booking", am: "ቦታ ማስያዣ" },
    fields: [
      { name: "name", type: "text", label: { en: "Name", am: "ስም" }, required: true },
      { name: "phone", type: "tel", label: { en: "Phone", am: "ስልክ" }, required: true },
      { name: "people", type: "number", label: { en: "People", am: "ሰዎች" } },
    ],
    submitLabel: { en: "Book", am: "ያስይዙ" },
    successMessage: { en: "Thank you", am: "እናመሰግናለን" },
  });
  await svc.cloud.saveForms(site.siteId, [form]);
  const names = ["Abebe Kebede", "Hana Tesfaye", "Dawit Alemu", "Selam Girma", "Meron Haile"];
  for (let i = 0; i < parsed.data.count; i++) {
    await svc.cloud.addSubmission({ siteId: site.siteId, projectId: site.projectId, ownerId: user.id, formKey: "booking", kind: "booking", data: { name: names[i % names.length]!, phone: `09110000${String(i).padStart(2, "0")}`, people: String((i % 4) + 1) }, lang: "en" });
  }
  return NextResponse.json({ ok: true });
}
