import type { Metadata } from "next";
import { replyText } from "@/components/builder/reply-text";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Builder } from "@/components/builder/builder";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { readTheme } from "@/lib/app/theme";
import { nextMonthlyGrant } from "@/lib/billing/credits";
import { creditSettings, launchOffer, ownerAllowance, planFeatures } from "@/lib/app/shell-data";
import { upgradeChoices, upgradeHref, upgradeMonth } from "@/lib/billing/upgrade";
import { offerBadgeText } from "@/lib/billing/offer-text";
import { setupSections } from "@/lib/builder/setup-steps";

export const metadata: Metadata = { robots: { index: false } };

export default async function ProjectPage({ params, searchParams }: PageProps<"/[lang]/build/[id]">) {
  const { lang, id } = await params;
  const wantsSetup = (await searchParams).setup === "1";
  if (!isLocale(lang) || !z.uuid().safeParse(id).success) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/build/${id}`);
  const owner = user.id;
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const project = await builder.store.getProject(owner, id);
  if (!project) notFound();
  const t = getMessages(lang);
  const [messages, versions, credits, theme, allowance, settings, cs, features, offer] = await Promise.all([
    builder.store.listMessages(owner, id),
    builder.store.listVersions(owner, id),
    services().billing.creditsLeft(owner),
    readTheme(),
    ownerAllowance(owner),
    services().billing.settings(),
    creditSettings(),
    planFeatures(),
    launchOffer(),
  ]);
  const now = new Date();
  const plan = allowance?.plan ?? "free";
  // Addis Ababa time: the grant lands at 03:00 there on the 1st.
  const nextGrant = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { day: "numeric", month: "long", timeZone: "Africa/Addis_Ababa" }).format(nextMonthlyGrant(now));
  const choices = upgradeChoices(plan, { prices: settings.prices, offer, now, features, topupCredits: cs.topupCredits });

  const who = user.name || user.phone || user.email || "";
  // Just started from a template (its only version, nothing asked yet): the editor plays the build of
  // the template's own sections once, over the preview, before showing the site.
  const fromTemplate = wantsSetup && messages.length === 0 && versions.length === 1 && versions[0]!.summary.startsWith("template:");
  const setup = fromTemplate ? setupSections((await builder.store.latestVersion(owner, id))?.files["src/site.json"] ?? "", Object.keys(t.builder.tlSection)) : null;

  return (
    <div data-gojo-theme={theme} className="flex h-dvh flex-col overflow-hidden bg-paper leading-normal text-ink">
      <div className="flex min-h-0 flex-1 flex-col">
        <Builder
          paused={builder.paused}
          locale={lang}
          projectId={id}
          t={t.builder}
          siteName={project.name || t.builder.untitled}
          chrome={{
            home: t.common.homeLink,
            logoAlt: t.common.logoAlt,
            back: t.builder.back,
            dashboard: t.dashboard.link,
            plan: t.billing.link,
            signOut: t.auth.signOut,
            signedInAs: t.auth.signedInAs.replace("{who}", () => who),
            language: t.common.languageSwitch,
            languageLabel: t.common.languageSwitchLabel,
            more: t.builder.menuMore,
            feedback: t.feedback.navLabel,
            feedbackAfterPublish: t.feedback.afterPublish,
            theme: t.app.theme,
            themes: t.app.themes,
            themeValue: theme,
          }}
          photoText={{
            photoAdded: t.dashboard.photoAdded,
            photoRemoved: t.dashboard.photoRemoved,
            photoLabel: t.dashboard.photoLabel,
            photoRemoveNamed: t.dashboard.photoRemoveNamed,
            photoRemove: t.dashboard.photoRemove,
            photoErrors: t.dashboard.photoErrors,
            loading: t.dashboard.loading,
          }}
          initialCredits={credits}
          setup={setup}
          nextGrant={nextGrant}
          upgrade={{
            plan,
            monthly: allowance?.monthly ?? features[plan].monthlyEdits,
            nextGrant,
            choices: choices.map((c) => ({ ...c, href: upgradeHref(lang, c.product) })),
            offerText: offer && choices.some((c) => c.wasMinor !== null) ? offerBadgeText(offer, lang, t.billing) : null,
            storageKey: `gojo.upgrade.${owner}`,
            month: upgradeMonth(now),
            planNames: t.billing.plans,
          }}
          upgradeText={t.upgrade}
          installText={t.pwa}
          noCredits={{ text: t.billing.noCredits, action: t.billing.getMore }}
          initialMessages={messages.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.role === "assistant" ? replyText(t.builder, m.status, m.text) : m.text,
            versionNumber: m.versionNumber,
            tone: m.status === "failed" ? "error" : undefined,
          }))}
          initialVersions={versions.map((v) => ({ number: v.number, summary: v.summary, createdAt: v.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
