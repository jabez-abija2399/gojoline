import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import type { LegalDoc } from "@/lib/i18n/messages/legal";

export function LegalPage({ locale, t, doc }: { locale: Locale; t: Messages; doc: LegalDoc }) {
  return (
    <>
      <SiteHeader locale={locale} t={t} />
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{doc.title}</h1>
          <p className="text-ink-muted">{doc.updated}</p>
          <p className="rounded-lg border border-line bg-white px-4 py-3">{doc.draftNote}</p>
        </header>
        {doc.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">{s.heading}</h2>
            {s.body.length > 1 ? (
              <ul className="flex list-disc flex-col gap-1 ps-6">
                {s.body.map((p) => (
                  <li key={p}>{withTelegramLink(p)}</li>
                ))}
              </ul>
            ) : (
              <p>{withTelegramLink(s.body[0] ?? "")}</p>
            )}
          </section>
        ))}
      </main>
      <SiteFooter locale={locale} t={t} />
    </>
  );
}

/** Makes the @gojoline_bot mention tappable. */
function withTelegramLink(text: string) {
  const [before, after] = text.split("@gojoline_bot");
  if (after === undefined) return text;
  return (
    <>
      {before}
      <a href="https://t.me/gojoline_bot" className="font-medium text-teal underline underline-offset-4">@gojoline_bot</a>
      {after}
    </>
  );
}
