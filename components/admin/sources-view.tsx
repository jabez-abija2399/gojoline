import { CopyButton } from "@/components/billing/copy-button";
import type { Messages } from "@/lib/i18n";
import type { ShortCode } from "@/lib/growth/short-links";

type T = Messages["admin"]["sources"];

export interface ShortLinkRow {
  code: ShortCode;
  url: string;
  network: string;
  today: number;
  d7: number;
  d30: number;
}
export interface SignupRow {
  name: string;
  d7: number;
  d30: number;
}

/** Admin → Sources: where people come from: visits from our short links, and sign-ups by first source. */
export function SourcesView({ t, links, signups, locale, copy, copied, failed }: { t: T; links: ShortLinkRow[]; signups: SignupRow[]; locale: "en" | "am"; copy: string; copied: string; failed: boolean }) {
  const num = new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-US");
  const total = (k: "today" | "d7" | "d30") => links.reduce((a, r) => a + r[k], 0);
  const signupTotal = (k: "d7" | "d30") => signups.reduce((a, r) => a + r[k], 0);
  const th = "px-3 py-2 text-start text-xs font-semibold text-ink-muted";
  const td = "px-3 py-2 tabular-nums";
  if (failed) return <p role="alert" className="rounded-xl bg-coral-soft p-4 text-destructive">{t.loadFailed}</p>;
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="src-links" className="rounded-xl border border-line bg-white p-4">
        <h2 id="src-links" className="text-base font-semibold">{t.linksTitle}</h2>
        <p className="mt-1 text-ink-muted">{t.linksIntro}</p>
        {/* Phones: one card per link, counts first. */}
        <ul className="mt-3 flex flex-col gap-2 sm:hidden">
          {links.map((r) => (
            <li key={r.code} className="flex flex-col gap-1.5 rounded-lg border border-line p-3">
              <span className="font-medium">{r.network}</span>
              <span className="tabular-nums text-ink-muted">{t.today} {num.format(r.today)} · {t.days7} {num.format(r.d7)} · {t.days30} {num.format(r.d30)}</span>
              <span className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-sunken px-1.5 py-0.5 text-xs [overflow-wrap:anywhere]">{r.url.replace(/^https?:\/\//, "")}</code>
                <CopyButton value={r.url} what={`${t.link}: ${r.network}`} copy={copy} copied={copied} />
              </span>
            </li>
          ))}
          <li className="px-3 font-semibold tabular-nums">{t.total}: {t.today} {num.format(total("today"))} · {t.days7} {num.format(total("d7"))} · {t.days30} {num.format(total("d30"))}</li>
        </ul>
        <div className="mt-3 hidden overflow-x-auto sm:block" tabIndex={0} role="region" aria-labelledby="src-links">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">{t.linksTitle}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={th}>{t.where}</th>
                <th scope="col" className={th}>{t.link}</th>
                <th scope="col" className={`${th} text-end`}>{t.today}</th>
                <th scope="col" className={`${th} text-end`}>{t.days7}</th>
                <th scope="col" className={`${th} text-end`}>{t.days30}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((r) => (
                <tr key={r.code} className="border-b border-line last:border-0">
                  <th scope="row" className="px-3 py-2 text-start font-medium">{r.network}</th>
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-sunken px-1.5 py-0.5 text-xs [overflow-wrap:anywhere]">{r.url.replace(/^https?:\/\//, "")}</code>
                      <CopyButton value={r.url} what={`${t.link}: ${r.network}`} copy={copy} copied={copied} />
                    </span>
                  </td>
                  <td className={`${td} text-end`}>{num.format(r.today)}</td>
                  <td className={`${td} text-end`}>{num.format(r.d7)}</td>
                  <td className={`${td} text-end`}>{num.format(r.d30)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-semibold">
                <th scope="row" colSpan={2} className="px-3 py-2 text-start">{t.total}</th>
                <td className={`${td} text-end`}>{num.format(total("today"))}</td>
                <td className={`${td} text-end`}>{num.format(total("d7"))}</td>
                <td className={`${td} text-end`}>{num.format(total("d30"))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-muted">{t.linksNote}</p>
      </section>

      <section aria-labelledby="src-signups" className="rounded-xl border border-line bg-white p-4">
        <h2 id="src-signups" className="text-base font-semibold">{t.signupsTitle}</h2>
        <p className="mt-1 text-ink-muted">{t.signupsIntro}</p>
        {signupTotal("d30") === 0 ? (
          <p className="mt-3 text-ink-muted">{t.none}</p>
        ) : (
          <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-labelledby="src-signups">
            <table className="w-full min-w-[360px] border-collapse">
              <caption className="sr-only">{t.signupsTitle}</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className={th}>{t.where}</th>
                  <th scope="col" className={`${th} text-end`}>{t.days7}</th>
                  <th scope="col" className={`${th} text-end`}>{t.days30}</th>
                </tr>
              </thead>
              <tbody>
                {signups.filter((r) => r.d30 > 0).map((r) => (
                  <tr key={r.name} className="border-b border-line last:border-0">
                    <th scope="row" className="px-3 py-2 text-start font-medium">{r.name}</th>
                    <td className={`${td} text-end`}>{num.format(r.d7)}</td>
                    <td className={`${td} text-end`}>{num.format(r.d30)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <th scope="row" className="px-3 py-2 text-start">{t.total}</th>
                  <td className={`${td} text-end`}>{num.format(signupTotal("d7"))}</td>
                  <td className={`${td} text-end`}>{num.format(signupTotal("d30"))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-ink-muted">{t.signupsNote}</p>
      </section>
    </div>
  );
}
