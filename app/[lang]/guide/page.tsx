import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { ArrowRight, MessageSquareHeart, Send } from "lucide-react";
import { GuideShot, GuideTip, NumberedSteps, SeekLink } from "@/components/guide/guide-parts";
import { GuideVideo } from "@/components/guide/guide-video";
import { WasPrice } from "@/components/pricing/offer-price";
import { formatBirr, PlanHighlights } from "@/components/pricing/plan-highlights";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { creditSettings, launchOffer, planFeatures } from "@/lib/app/shell-data";
import { looksSignedIn } from "@/lib/auth/signed-in";
import { REQUEST_SIZES } from "@/lib/billing/credits";
import { offerPrice } from "@/lib/billing/discounts";
import { offerBadgeText } from "@/lib/billing/offer-text";
import { PLAN_IDS } from "@/lib/billing/plans";
import { ANSWER_REFUNDS_PER_DAY, REFUND_CREDITS_PER_DAY, freeFirstBuildsPerMonth } from "@/lib/billing/service";
import { REFERRAL_MONTHLY_CAP } from "@/lib/growth/referral-rules";
import { GUIDE_SECTIONS, GUIDE_SHOTS, POSTER_FILE, VIDEO_FILE, trackSrc } from "@/lib/guide/sections";
import { CHAPTERS_TXT, VIDEO_BYTES, clock, parseChapters, sectionStarts } from "@/lib/guide/video";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { format, getMessages, type Messages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/guide">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const g = getMessages(lang).guide;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    alternates: { canonical: `/${lang}/guide`, languages: { en: "/en/guide", am: "/am/guide", "x-default": "/en/guide" } },
  };
}

/** Parsed once per server: where each section starts in the video. */
const STARTS = sectionStarts(parseChapters(CHAPTERS_TXT));

/**
 * The button and tab names the guide mentions, read from the app's own messages so the guide
 * always says what the screen says (in either language).
 */
function uiLabels(t: Messages): Record<string, string> {
  const b = t.builder;
  const d = t.dashboard;
  return {
    startFree: t.landing.nav.start,
    sendCode: t.auth.sendCode,
    google: t.auth.google,
    newSite: b.newSite,
    ready: b.readyTitle.replace(/[!！]$/, ""),
    preview: b.tabPreview,
    photos: b.tabPhotos,
    versions: b.tabVersions,
    undo: b.undo,
    photosDrop: b.photosDrop,
    photoUse: b.photoUse,
    bringBack: b.versionRestore,
    publish: b.publish,
    publishNow: b.publishNow,
    copyLink: b.publishedCopy,
    domainTitle: b.domainTitle,
    share: d.share,
    qr: d.qr,
    download: d.qrDownload,
    markReplied: d.markReplied,
    markDone: d.markDone,
    statusNew: d.status.new,
    closedToday: d.closedToday,
    offline: d.offlineCta,
    settings: d.tabSettings,
    tabHome: d.tabHome,
    tabMessages: d.tabMessages,
    tabInfo: d.tabInfo,
    dashboardButton: d.link,
    sites: t.app.sites,
    plan: t.app.plan,
    submit: t.billing.submit,
    invite: t.growth.invite.nav,
    feedback: t.feedback.navLabel,
    report: t.footer.report,
  };
}

/** "How to use Gojoline": the video, ten illustrated sections, questions. Open to everyone. */
export default async function GuidePage({ params }: PageProps<"/[lang]/guide">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // The poster is the largest thing on screen: fetch it first (a video poster cannot take fetchpriority).
  preload(POSTER_FILE, { as: "image", fetchPriority: "high" });
  const t = getMessages(lang);
  // The guide always uses the public frame: the app shell's client code would ship to every
  // visitor otherwise. A signed-in owner gets "Your sites" in the header and direct links.
  const signedIn = await looksSignedIn();
  const [{ prices }, features, credits, offer] = await Promise.all([services().billing.settings(), planFeatures(), creditSettings(), launchOffer()]);
  const bot = services().telegram?.username ?? "gojoline_bot";
  const content = <GuideContent locale={lang} t={t} signedIn={signedIn} prices={prices} features={features} credits={credits} offer={offer} bot={bot} />;

  return (
    <>
      <SiteHeader locale={lang} t={t} nav />
      <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col focus:outline-none">
        {content}
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}

type Props = {
  locale: Locale;
  t: Messages;
  signedIn: boolean;
  prices: Awaited<ReturnType<ReturnType<typeof services>["billing"]["settings"]>>["prices"];
  features: Awaited<ReturnType<typeof planFeatures>>;
  credits: Awaited<ReturnType<typeof creditSettings>>;
  offer: Awaited<ReturnType<typeof launchOffer>>;
  bot: string;
};

function GuideContent({ locale, t, signedIn, prices, features, credits, offer, bot }: Props) {
  const g = t.guide;
  const labels = uiLabels(t);
  const list = (items: string[]) => new Intl.ListFormat(locale === "am" ? "am" : "en", { type: "conjunction" }).format(items);
  const plansWhere = (has: (p: (typeof PLAN_IDS)[number]) => boolean) => list(PLAN_IDS.filter(has).map((p) => t.billing.plans[p]));
  // Rules from the code and the plans, so the guide says exactly what the app does.
  const rules: Record<string, string | number> = {
    n: REFUND_CREDITS_PER_DAY,
    m: ANSWER_REFUNDS_PER_DAY,
    firstBuilds: list(PLAN_IDS.map((p) => `${t.billing.plans[p]} ${freeFirstBuildsPerMonth(p)}`)),
    telegramPlans: plansWhere((p) => features[p].telegramNotify),
    noTelegramPlans: plansWhere((p) => !features[p].telegramNotify),
  };
  const f = (s: string, extra: Record<string, string | number> = {}) => format(s, { ...labels, ...rules, ...extra });
  const now = new Date();
  const telegram = `https://t.me/${bot}`;
  const buildHref = signedIn ? `/${locale}/build` : `/${locale}/sign-in?next=/${locale}/build`;
  const feedbackHref = signedIn ? `/${locale}/feedback?from=/${locale}/guide` : `/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/feedback`)}`;
  const time = (id: (typeof GUIDE_SECTIONS)[number]) => STARTS.get(GUIDE_SECTIONS.indexOf(id) + 1) ?? 0;
  const topupOffer = offerPrice(offer, "topup", prices.topup, now);
  const faqValues = {
    plans: list(PLAN_IDS.filter((p) => features[p].customDomain).map((p) => t.billing.plans[p])),
    // Own domain: who gets a guide and who gets it done (PLAN_FEATURES.domainHelp).
    domainHelp: [format(g.domainGuide, { plans: plansWhere((p) => features[p].domainHelp === "guide") }), format(g.domainForYou, { plans: plansWhere((p) => features[p].domainHelp === "done_for_you") })].join(" "),
    sites: format(g.sitesAnswer, { list: list(PLAN_IDS.map((p) => format(g.sitesPlan, { plan: t.billing.plans[p], n: features[p].maxSites }))) }),
  };
  const sizeCost = (n: number) => (n === 1 ? g.sections.edit.sizeCostOne : format(g.sections.edit.sizeCost, { n }));
  const mb = (VIDEO_BYTES / 1e6).toFixed(1);
  const link = "font-medium text-link underline underline-offset-4";

  const tocItems = (
    <ol className="flex flex-col gap-0.5">
      {GUIDE_SECTIONS.map((id, i) => (
        <li key={id} className="flex items-center gap-1">
          <a href={`#guide-${id}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink hover:bg-sunken lg:min-h-9">
            <span aria-hidden="true" className="w-5 shrink-0 text-end tabular-nums text-ink-muted">{i + 1}.</span>
            <span className="min-w-0">{g.sections[id].title}</span>
          </a>
          <SeekLink seconds={time(id)} label={format(g.toc.playNamed, { n: i + 1, title: g.sections[id].title, time: clock(time(id)) })} className="min-h-11 shrink-0 rounded-lg px-2 text-sm text-ink-muted tabular-nums hover:bg-sunken hover:text-ink lg:min-h-9">
            {clock(time(id))}
          </SeekLink>
        </li>
      ))}
      <li>
        <a href="#guide-faq" className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink hover:bg-sunken lg:min-h-9">
          <span aria-hidden="true" className="w-5 shrink-0" />
          {g.toc.faq}
        </a>
      </li>
    </ol>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <p className={`text-sm font-semibold text-ink-muted ${locale === "am" ? "" : "uppercase tracking-wide"}`}>{g.eyebrow}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">{g.title}</h1>
        <p className="max-w-[65ch] text-lg text-ink-muted">{g.intro}</p>
        {locale !== "en" && <p className="max-w-[65ch] rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-muted">{g.screenshotsNote}</p>}
      </header>

      <div className="flex max-w-4xl flex-col gap-2">
        <GuideVideo
          src={VIDEO_FILE}
          poster={POSTER_FILE}
          label={g.video.label}
          fallback={g.video.fallback}
          download={format(g.video.download, { size: format(g.video.size, { n: mb }) })}
          tracks={[
            { kind: "captions", src: trackSrc("captions", "en"), srcLang: "en", label: g.video.captionsEn },
            { kind: "captions", src: trackSrc("captions", "am"), srcLang: "am", label: g.video.captionsAm, default: locale === "am" },
            { kind: "chapters", src: trackSrc("chapters", locale), srcLang: locale, label: g.video.chaptersLabel },
          ]}
        />
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span>{g.video.length}</span>
          <a href={VIDEO_FILE} download className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 lg:min-h-9">
            {format(g.video.download, { size: format(g.video.size, { n: mb }) })}
          </a>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label={g.toc.title} className="hidden lg:block">
          <div className="sticky top-24 flex max-h-[calc(100dvh-8rem)] flex-col gap-2 overflow-y-auto">
            <p className="px-2 text-sm font-semibold text-ink-muted">{g.toc.title}</p>
            {tocItems}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          <details data-toc className="group rounded-2xl border border-line bg-white lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold [&::-webkit-details-marker]:hidden">
              {g.toc.title}
              <ArrowRight aria-hidden="true" className="size-4 rotate-90 transition-transform group-open:-rotate-90" />
            </summary>
            <nav aria-label={g.toc.title} className="border-t border-line p-2">
              {tocItems}
            </nav>
          </details>

          {GUIDE_SECTIONS.map((id, i) => {
            const s = g.sections[id];
            return (
              <section key={id} id={`guide-${id}`} aria-labelledby={`guide-${id}-title`} className="flex scroll-mt-24 flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h2 id={`guide-${id}-title`} tabIndex={-1} className="flex items-center gap-3 font-display focus:outline-none text-2xl font-bold tracking-tight">
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-soft text-base text-ink tabular-nums">{i + 1}</span>
                    {s.title}
                  </h2>
                  <SeekLink seconds={time(id)} className="min-h-11 w-fit text-sm font-medium text-ink underline underline-offset-4 lg:min-h-9">
                    {format(g.toc.watchPart, { time: clock(time(id)) })}
                  </SeekLink>
                  <p className="max-w-[65ch] text-lg">{f(s.intro)}</p>
                </div>

                {id === "describe" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1 rounded-xl border-2 border-lagoon bg-white p-4">
                      <p className="text-sm font-semibold"><span aria-hidden="true">✓ </span>{g.sections.describe.goodTitle}</p>
                      <p className="text-ink">{g.sections.describe.good}</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-dashed border-line bg-white p-4">
                      <p className="text-sm font-semibold"><span aria-hidden="true">✗ </span>{g.sections.describe.vagueTitle}</p>
                      <p className="text-ink-muted">{g.sections.describe.vague}</p>
                    </div>
                  </div>
                )}

                {id === "plan" && <PlanCards t={t} locale={locale} prices={prices} features={features} offer={offer} now={now} />}

                <div className="flex max-w-[65ch] flex-col gap-3">
                  {id === "plan" && <h3 className="font-semibold">{t.billing.pay.stepsTitle}</h3>}
                  <NumberedSteps steps={s.steps.map((x) => f(x))} label={format(g.stepsFor, { title: s.title })} />
                </div>

                {id === "edit" && <EditDetails t={t} sizeCost={sizeCost} credits={credits} />}
                {id === "plan" && (
                  <ul className="flex max-w-[65ch] list-disc flex-col gap-2 ps-5">
                    <li>{g.sections.plan.receipt}</li>
                    <li>{g.sections.plan.checking}</li>
                    <li>{format(g.sections.plan.topup, { n: credits.topupCredits, price: formatBirr(topupOffer ?? prices.topup) })}</li>
                    <li>{f(g.sections.plan.invite, { n: credits.monthly.starter, cap: REFERRAL_MONTHLY_CAP })}</li>
                  </ul>
                )}

                {id === "publish" && <p className="max-w-[65ch] rounded-xl border border-warning/40 bg-white p-4">{g.sections.publish.unfinished}</p>}

                {s.tip && <GuideTip label={format(g.tipLabel, { label: g.tip })}>{f(s.tip)}</GuideTip>}

                <div className="flex flex-col gap-4">
                  {GUIDE_SHOTS[id].map((shot, k) => (
                    <GuideShot key={shot.desktop} shot={shot} alt={s.shots[k] ?? ""} />
                  ))}
                </div>
              </section>
            );
          })}

          <section id="guide-faq" aria-labelledby="guide-faq-title" className="flex scroll-mt-24 flex-col gap-4">
            <h2 id="guide-faq-title" tabIndex={-1} className="font-display focus:outline-none text-2xl font-bold tracking-tight">{g.faqTitle}</h2>
            <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
              {g.faq.map((item) => (
                <details key={item.q} className="group px-4">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                    {f(item.q)}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 rotate-90 transition-transform group-open:-rotate-90" />
                  </summary>
                  <p className="max-w-[65ch] pb-4 text-ink">{f(item.a, faqValues)}</p>
                </details>
              ))}
            </div>
            <p className="flex flex-wrap items-center gap-x-6 text-ink-muted">
              <Link href={`/${locale}/report`} className={`${link} inline-flex min-h-11 items-center lg:min-h-9`}>{t.footer.report}</Link>
              <a href={telegram} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex min-h-11 items-center lg:min-h-9`}>
                {g.ctaTelegram}
                <span className="sr-only"> {g.newTab}</span>
              </a>
            </p>
          </section>

          <section aria-labelledby="guide-cta-title" className="gojo-tone-light flex flex-col items-start gap-4 rounded-3xl bg-ink p-6 text-white sm:p-10">
            <h2 id="guide-cta-title" className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{g.ctaTitle}</h2>
            <p className="max-w-[55ch] text-lg text-sunken">{g.ctaBody}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={buildHref} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 font-semibold text-on-coral transition-colors hover:bg-coral-hover">
                {g.ctaBuild}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href={feedbackHref} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/40 px-6 font-semibold text-white transition-colors hover:bg-white/10">
                <MessageSquareHeart aria-hidden="true" className="size-4" />
                {g.ctaFeedback}
              </Link>
              <a href={telegram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-semibold text-white underline underline-offset-4 hover:bg-white/10">
                <Send aria-hidden="true" className="size-4" />
                {g.ctaTelegram}
                <span className="sr-only"> {g.newTab}</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Example requests and how many changes each size uses (Admin → Settings values). */
function EditDetails({ t, sizeCost, credits }: { t: Messages; sizeCost: (n: number) => string; credits: Props["credits"] }) {
  const e = t.guide.sections.edit;
  return (
    <div className="flex max-w-[65ch] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{e.examplesTitle}</h3>
        <ul className="flex flex-wrap gap-2">
          {e.examples.map((x) => (
            <li key={x} className="rounded-2xl border border-line bg-white px-3 py-2">{format(t.guide.quoted, { text: x })}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{e.sizesTitle}</h3>
        <p>{e.sizesIntro}</p>
        <dl className="grid gap-2 sm:grid-cols-3">
          {REQUEST_SIZES.map((size) => (
            <div key={size} className="flex flex-col gap-1 rounded-xl border border-line bg-white p-3">
              <dt className="text-sm text-ink-muted">{e.sizes[size]}</dt>
              <dd className="font-semibold tabular-nums">{sizeCost(credits.sizeCredits[size])}</dd>
            </div>
          ))}
        </dl>
        <p>{format(e.question, { m: ANSWER_REFUNDS_PER_DAY })}</p>
        <p>{format(e.failed, { n: REFUND_CREDITS_PER_DAY })}</p>
      </div>
    </div>
  );
}

/** The three plans with this month's prices (Admin → Settings, with the launch offer while it runs). */
function PlanCards({ t, locale, prices, features, offer, now }: { t: Messages; locale: Locale; prices: Props["prices"]; features: Props["features"]; offer: Props["offer"]; now: Date }) {
  const p = t.guide.sections.plan;
  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-semibold">{p.plansTitle}</h3>
      <ul className="grid gap-3 md:grid-cols-3">
        {PLAN_IDS.map((plan) => {
          const base = plan === "free" ? 0 : prices[`${plan}_month`];
          const offered = plan === "free" ? null : offerPrice(offer, `${plan}_month`, base, now);
          return (
            <li key={plan} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-lg font-bold">{t.billing.plans[plan]}</h4>
                <p className="font-display text-xl font-semibold tabular-nums">{plan === "free" ? p.priceFree : format(p.priceMonth, { price: formatBirr(offered ?? base) })}</p>
                {offered !== null && offer && (
                  <p className="text-sm text-ink-muted">
                    {offerBadgeText(offer, locale, t.billing)} · <WasPrice price={format(t.billing.price, { price: formatBirr(base) })} was={t.billing.was} />
                  </p>
                )}
              </div>
              <PlanHighlights plan={plan} t={t.plans.hl} limit={4} features={features} className="text-sm" />
            </li>
          );
        })}
      </ul>
      <Link href={`/${locale}/pricing#compare`} className="inline-flex min-h-11 w-fit items-center font-medium text-link underline underline-offset-4 lg:min-h-9">{t.plans.compareLink}</Link>
    </div>
  );
}
