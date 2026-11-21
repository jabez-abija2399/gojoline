import type { AnalyticsReport, Metric } from "@/lib/analytics/report";
import { escapeHtml } from "@/lib/telegram/client";
import type { SocialPost } from "./types";

/** Monday 09:00–09:14 Addis Ababa time: the window the 15-minute run sends the weekly summary in. */
export function isDigestTime(day: string, time: string): boolean {
  return new Date(`${day}T00:00:00Z`).getUTCDay() === 1 && time >= "09:00" && time < "09:15";
}

/** Last week's numbers (the week report's last finished bucket) for the founder, in Telegram HTML. */
export function weeklyDigest(report: AnalyticsReport, posts: SocialPost[]): string {
  const last = (m: Metric) => report.series[m].at(-2)?.value ?? 0;
  const before = (m: Metric) => report.series[m].at(-3)?.value ?? 0;
  const line = (label: string, m: Metric, fmt = (n: number) => String(n)) => {
    const now = last(m);
    const was = before(m);
    const delta = now === was ? "" : now > was ? ` (▲ ${fmt(now - was)})` : ` (▼ ${fmt(was - now)})`;
    return `${label}: <b>${fmt(now)}</b>${delta}`;
  };
  const birr = (minor: number) => `${new Intl.NumberFormat("en-US").format(Math.round(minor / 100))} Birr`;
  const sent = posts.filter((p) => p.status === "posted").length;
  const top = report.sources.slice(0, 3).map((s) => `${escapeHtml(s.source)} ${s.n}`).join(", ");
  return [
    "<b>Gojoline: last week</b>",
    line("Sign-ups", "signups"),
    line("Sites started", "sitesStarted"),
    line("Sites published", "published"),
    line("Payments approved", "payments"),
    line("Revenue", "revenue", birr),
    line("Site visits", "visits"),
    `Posts sent: <b>${sent}</b>`,
    top ? `Where new owners came from (this week so far): ${top}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
