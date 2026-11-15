import { simpleEmail, type EmailSender } from "@/lib/providers/notify/email";
import { escapeHtml, type TelegramClient } from "@/lib/telegram/client";
import type { TelegramStore } from "@/lib/telegram/store";
import type { Product } from "./plans";
import type { BillingStore, Payment } from "./store";

const names: Record<Product, { en: string; am: string }> = {
  starter_month: { en: "Starter, 1 month", am: "ስታርተር፣ 1 ወር" },
  starter_year: { en: "Starter, 1 year", am: "ስታርተር፣ 1 ዓመት" },
  business_month: { en: "Business, 1 month", am: "ቢዝነስ፣ 1 ወር" },
  business_year: { en: "Business, 1 year", am: "ቢዝነስ፣ 1 ዓመት" },
  topup: { en: "50 extra changes", am: "50 ተጨማሪ ለውጦች" },
};
const birr = (minor: number) => `${new Intl.NumberFormat("en-US").format(minor / 100)} Birr`;

export interface PaymentNoticeDeps {
  email: EmailSender | null;
  appUrl: string;
  adminEmails: string[];
  store: BillingStore;
  telegram?: { store: TelegramStore; client: TelegramClient } | null;
}

/** Tells admins a payment is waiting, so customers don't wait a day for a check. */
export async function noticeNewPayment(deps: PaymentNoticeDeps, payment: Payment): Promise<void> {
  if (!deps.email || deps.adminEmails.length === 0) return;
  const link = `${deps.appUrl}/en/admin?tab=payments`;
  const body = simpleEmail({
    en: [`New payment to check: ${names[payment.product].en}, ${birr(payment.amountMinor)}, ${payment.method} ${payment.reference}.`, `Review it: ${link}`],
    am: [`የሚረጋገጥ አዲስ ክፍያ፦ ${names[payment.product].am}፣ ${birr(payment.amountMinor)}።`],
  });
  await Promise.all(deps.adminEmails.map((to) => deps.email!.send({ to, subject: `Payment to check: ${birr(payment.amountMinor)} (${payment.reference})`, ...body })));
}

/** Tells the customer how their payment was decided, by email and Telegram when we can. */
export async function noticeDecision(deps: PaymentNoticeDeps, payment: Payment, decision: "approve" | "reject", note: string | null): Promise<void> {
  const ok = decision === "approve";
  const product = names[payment.product];
  const billingUrl = `${deps.appUrl}/en/billing`;
  const en = ok
    ? [`Your payment for ${product.en} (${birr(payment.amountMinor)}) is approved. Your plan is on.`, `See your plan: ${billingUrl}`]
    : [`We couldn't confirm your payment for ${product.en} (${birr(payment.amountMinor)}, transaction ${payment.reference}).`, ...(note ? [`Note: ${note}`] : []), `Please check the transaction number or contact us: ${billingUrl}`];
  const am = ok
    ? [`ለ${product.am} (${birr(payment.amountMinor)}) ያደረጉት ክፍያ ጸድቋል። ዕቅድዎ በርቷል።`]
    : [`ለ${product.am} ያደረጉትን ክፍያ (የግብይት ቁጥር ${payment.reference}) ማረጋገጥ አልቻልንም። እባክዎ የግብይት ቁጥሩን ያረጋግጡ ወይም ያግኙን።`];
  const contact = await deps.store.contactFor(payment.userId);
  const tasks: Promise<unknown>[] = [];
  if (deps.email && contact?.email) {
    tasks.push(deps.email.send({ to: contact.email, subject: ok ? "Your Gojoline payment is approved · ክፍያዎ ጸድቋል" : "About your Gojoline payment · ስለ ክፍያዎ", ...simpleEmail({ en, am }) }));
  }
  const link = deps.telegram ? await deps.telegram.store.byUser(payment.userId) : null;
  if (deps.telegram && link) {
    const lines = link.locale === "am" ? am : en;
    tasks.push(deps.telegram.client.sendMessage(link.chatId, lines.map(escapeHtml).join("\n")));
  }
  await Promise.allSettled(tasks);
}
