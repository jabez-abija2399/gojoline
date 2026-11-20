"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FileText, History, Images, MessageCircle } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { nextTimeline, startTimeline, type Timeline } from "./build-timeline";
import { ChatPanel, type UiMessage } from "./chat-panel";
import type { SiteLanguages } from "./language-choice";
import type { PhotoText } from "./photos-panel";
import { PreviewControls, PreviewPanel, type Device } from "./preview-panel";
import { PublishBar } from "./publish-bar";
import { previewView } from "./preview-view";
import { takeStartPrompt } from "./start-prompt";
import { TabList } from "./tab-list";
import { TopBar, type TopBarText } from "./top-bar";
import { usePhotos } from "./use-photos";
import { format } from "@/lib/i18n/format";
import type { UpgradeInfo } from "@/components/billing/upgrade-dialog";
import type { InstallSheetText } from "@/components/pwa/install-sheet";
import { LazyInstallSheet } from "@/components/pwa/install-sheet-lazy";
import { markInstallMoment } from "@/components/pwa/install-memory";
import { shouldOpenUpgrade, type UpgradeTrigger } from "@/lib/billing/upgrade-rules";

/** "Used 2 changes · 18 left" under an AI answer (a free first build says so). */
function usageNote(t: Messages["builder"], charged: number, left: number, firstBuild: boolean): string {
  if (charged === 0) return format(firstBuild ? (left === 1 ? t.usedFreeOne : t.usedFree) : left === 1 ? t.usedNoneOne : t.usedNone, { left });
  return format(charged === 1 ? t.usedOne : t.usedMany, { n: charged, left });
}
import type { UiVersion } from "./versions-panel";
import { replyText } from "./reply-text";

// Opened now and then, not on every visit: their code loads the first time they are shown.
const VersionsPanel = dynamic(() => import("./versions-panel").then((m) => m.VersionsPanel));
const PhotosPanel = dynamic(() => import("./photos-panel").then((m) => m.PhotosPanel));
const CodePanel = dynamic(() => import("./code-panel").then((m) => m.CodePanel));
// Shown only when an owner runs out: loaded after the page.
const UpgradeDialog = dynamic(() => import("@/components/billing/upgrade-dialog").then((m) => m.UpgradeDialog), { ssr: false });

type Tab = "chat" | "preview" | "photos" | "versions" | "code";
type SideTab = Exclude<Tab, "chat">;
const SIDE_TABS = ["preview", "photos", "versions", "code"] as const;
const TAB_ICONS = { chat: MessageCircle, preview: Eye, photos: Images, versions: History, code: FileText };

interface Props {
  /** Building is paused (no sandbox): the chat says so once; no preview is opened. */
  paused?: boolean;
  noCredits: { text: string; action: string };
  /** When the next monthly changes arrive, e.g. "1 December". */
  nextGrant: string;
  locale: Locale;
  projectId: string;
  t: Messages["builder"];
  chrome: TopBarText;
  photoText: PhotoText;
  /** The site's name, or the "New site" placeholder until the first build names it. */
  siteName: string;
  initialMessages: UiMessage[];
  initialVersions: UiVersion[];
  /** AI changes the owner has left when the page opens. */
  initialCredits: number;
  /** The "no changes left" dialog: prices, plans and the offer from the server. */
  upgrade: UpgradeInfo;
  upgradeText: Messages["upgrade"];
  installText: InstallSheetText;
}

/** The month the owner last closed the upgrade dialog; null when unknown or storage is blocked. */
function readDismissed(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

let localId = 0;
const nextId = () => `local-${++localId}`;

/** A bigger request waiting for "Go ahead" (nothing was run or charged yet). */
export interface PendingConfirm {
  text: string;
  languages: SiteLanguages;
  size: "medium" | "large";
  cost: number;
  left: number;
}

export function Builder({ locale, projectId, t, chrome, photoText, siteName, initialMessages, initialVersions, initialCredits, noCredits, nextGrant, upgrade, upgradeText, installText, paused = false }: Props) {
  const [credits, setCredits] = useState<number | null>(initialCredits);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  // Mounted from the first time it opens, then kept (closing it returns focus where it was).
  const [upgradeSeen, setUpgradeSeen] = useState(false);
  // The balance before a run, to tell when a run used the last change.
  const creditsRef = useRef<number | null>(initialCredits);
  useEffect(() => {
    creditsRef.current = credits;
  }, [credits]);
  const maybeUpgrade = useCallback(
    (trigger: UpgradeTrigger, before: number | null, after: number | null) => {
      const open = shouldOpenUpgrade(trigger, { before, after, hasSite: versionsRef.current > 0, dismissedMonth: readDismissed(upgrade.storageKey), month: upgrade.month });
      if (open) {
        setUpgradeSeen(true);
        setUpgradeOpen(true);
      }
      return open;
    },
    [upgrade.storageKey, upgrade.month],
  );
  const onLive = useCallback((url: string | null) => {
    setLiveUrl(url);
    // A live site: a good moment to offer the app.
    if (url) markInstallMoment();
  }, []);
  const closeUpgrade = useCallback(() => {
    setUpgradeOpen(false);
    try {
      localStorage.setItem(upgrade.storageKey, upgrade.month);
    } catch {
      // Not remembered: it may open once more after a run this month.
    }
  }, [upgrade.storageKey, upgrade.month]);
  // A site that only has its template version: show it first and say what to change.
  const templateId = initialVersions.length === 1 ? /^template:([a-z-]+)$/.exec(initialVersions[0]!.summary)?.[1] : undefined;
  const templateName = templateId ? (t.templates as Record<string, string>)[templateId] : undefined;
  const welcome = templateName ? t.welcomeTemplate.replace("{industry}", templateName) : undefined;
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [versions, setVersions] = useState<UiVersion[]>(initialVersions);
  const [current, setCurrent] = useState<number | null>(initialVersions[0]?.number ?? null);
  const [working, setWorking] = useState(false);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  // Read inside send() without re-creating it on every version change.
  const versionsRef = useRef(initialVersions.length);
  // Asked before the first build; defaults to the language the owner uses Gojoline in.
  const [siteLanguages, setSiteLanguages] = useState<SiteLanguages>([locale]);
  const [name, setName] = useState(siteName);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("phone");
  // The first site made in this visit gets a small celebration.
  const [celebrate, setCelebrate] = useState(false);
  // Phones: a dot on the Preview tab when the site changed while the owner was elsewhere.
  const [previewFresh, setPreviewFresh] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Paused: no preview is opened (the panel says building is paused).
  const [previewLoading, setPreviewLoading] = useState(!paused && initialVersions.length > 0);
  const [previewError, setPreviewError] = useState(false);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<Tab>(templateName ? "preview" : "chat");
  const [deskTab, setDeskTab] = useState<SideTab>("preview");
  // Side views mount the first time they are opened and then stay (they keep their state).
  const [opened, setOpened] = useState<ReadonlySet<Tab>>(() => new Set<Tab>(["chat", "preview"]));
  const markOpened = (tab: Tab) => setOpened((s) => (s.has(tab) ? s : new Set(s).add(tab)));
  // The photo list is fetched the first time the Photos view is opened.
  const [photosWanted, setPhotosWanted] = useState(false);
  const photos = usePhotos(projectId, photosWanted);
  // The message being written lives here so photos and suggestions can add to it.
  const [draft, setDraft] = useState("");
  const [focusChat, setFocusChat] = useState(0);
  const lastBuildFailed = useRef(false);
  // The latest first build ended without a site: the preview says so (never the starter template).
  const [firstBuildFailed, setFirstBuildFailed] = useState(false);
  // A first build's site built cleanly: its preview loads under the placeholder before it is saved.
  const [firstBuildWarm, setFirstBuildWarm] = useState(false);

  // Wake the sandbox for an existing site so the preview shows straight away.
  useEffect(() => {
    if (paused || initialVersions.length === 0) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}/preview`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("preview"))))
      .then((data: { url: string | null }) => {
        if (!cancelled && data.url) setPreviewUrl(data.url);
      })
      .catch(() => !cancelled && setPreviewError(true))
      .finally(() => !cancelled && setPreviewLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId, initialVersions.length, previewAttempt, paused]);

  const addAssistant = useCallback((text: string, extra: Partial<UiMessage> = {}) => {
    setMessages((m) => [...m, { id: nextId(), role: "assistant", text, ...extra }]);
  }, []);

  const send = useCallback(
    async (text: string, languages: SiteLanguages, confirmed?: { size: PendingConfirm["size"]; cost: number }) => {
      // Going ahead with a bigger request: its message is already in the chat.
      if (!confirmed) setMessages((m) => [...m, { id: nextId(), role: "owner", text }]);
      setConfirm(null);
      const before = creditsRef.current;
      setWorking(true);
      setTimeline(startTimeline(Date.now()));
      setFirstBuildFailed(false);
      setFirstBuildWarm(false);
      lastBuildFailed.current = false;
      // Anything but an answer, a question about cost or a refusal is a failed run.
      let failed = true;
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, ...(versionsRef.current === 0 ? { languages } : {}), ...(confirmed ? { confirmSize: confirmed.size, confirmCost: confirmed.cost } : {}) }),
        });
        if (res.status === 429) return addAssistant(t.tooMany, { tone: "error" });
        if (!res.ok || !res.body) return addAssistant(t.failed, { tone: "error" });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            const event = JSON.parse(line);
            switch (event.type) {
              case "preview":
                setPreviewUrl(event.url);
                setPreviewLoading(false);
                break;
              // Real progress from the agent: planning, a tool starting, the sections it writes,
              // a tool that ran, finishing up near the budget, saving the new version. Never the
              // model's own words: its working notes (colours, contrast checks) are not for owners.
              case "plan":
              case "tool_start":
              case "section":
              case "tool":
              case "wrap_up":
              case "saving":
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                break;
              case "build":
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                lastBuildFailed.current = !event.ok;
                if (event.ok) setReloadKey((k) => k + 1);
                if (versionsRef.current === 0) setFirstBuildWarm(!!event.ok);
                break;
              case "needs_confirm":
                // Nothing ran: the owner sees the cost and decides.
                finished = true;
                failed = false;
                if (typeof event.credits === "number") setCredits(event.credits);
                setConfirm({ text, languages, size: event.size, cost: event.cost, left: event.credits });
                break;
              case "done": {
                finished = true;
                // The server's count after charging (and any refund), so it is never guessed.
                if (typeof event.credits === "number") setCredits(event.credits);
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                const m = event.message;
                failed = m.status === "failed";
                const usage = typeof event.charged === "number" && typeof event.credits === "number" ? usageNote(t, event.charged, event.credits, versionsRef.current === 0 && m.status === "changed") : undefined;
                if (m.status === "failed") addAssistant(event.tooBig ? t.tooBigFailed : t.reverted, { tone: "error", usage });
                else addAssistant(event.tooBig ? [m.text, t.tooBigPartial].filter(Boolean).join("\n\n") : replyText(t, m.status, m.text), { versionNumber: m.versionNumber, usage });
                if (typeof event.siteName === "string" && event.siteName) setName(event.siteName);
                if (typeof event.credits === "number") maybeUpgrade("after_run", before, event.credits);
                if (m.versionNumber) {
                  // The first site made: a good moment to offer the app.
                  markInstallMoment();
                  const first = versionsRef.current === 0;
                  if (first) setCelebrate(true);
                  setPreviewFresh(true);
                  versionsRef.current += 1;
                  setVersions((v) => [{ number: m.versionNumber, summary: text.slice(0, 140), createdAt: new Date().toISOString() }, ...v]);
                  setCurrent(m.versionNumber);
                  // A first build's frame already loaded its last good build under the placeholder:
                  // keep it, so the reveal is instant.
                  if (!first || lastBuildFailed.current) setReloadKey((k) => k + 1);
                }
                break;
              }
              case "error":
                finished = true;
                if (typeof event.credits === "number") setCredits(event.credits);
                failed = event.code !== "no_credits" && event.code !== "blocked";
                if (event.code === "no_credits") {
                  // Not enough for this request (but some left): say what it needs; none left: say so.
                  const some = typeof event.cost === "number" && (event.credits ?? 0) > 0;
                  addAssistant(some ? format(t.notEnough, { cost: event.cost, left: event.credits }) : noCredits.text, { tone: "error", action: { href: `/${locale}/billing`, label: noCredits.action } });
                  if (typeof event.credits === "number") maybeUpgrade("refused", before, event.credits);
                }
                // A refusal is a normal answer, not a system failure.
                else if (event.code === "blocked") addAssistant(t.blocked);
                else addAssistant(event.code === "busy" ? t.busy : event.code === "paused" ? t.paused : t.failed, { tone: "error" });
                break;
            }
          }
        }
        if (!finished) addAssistant(t.failed, { tone: "error" });
      } catch {
        addAssistant(t.failed, { tone: "error" });
      } finally {
        if (failed && versionsRef.current === 0) setFirstBuildFailed(true);
        setWorking(false);
        setTimeline(null);
      }
    },
    [projectId, t, addAssistant, noCredits, locale, maybeUpgrade],
  );

  // A description typed on "Your sites" starts the build as soon as the new site opens.
  useEffect(() => {
    if (paused || initialMessages.length > 0 || initialVersions.length > 0) return;
    // After hydration, and only once: the prompt is removed from storage as it is read.
    const id = setTimeout(() => {
      const start = takeStartPrompt();
      if (start) void send(start.text, start.languages);
    }, 0);
    return () => clearTimeout(id);
  }, [initialMessages.length, initialVersions.length, send, paused]);

  const retryPreview = useCallback(() => {
    setPreviewError(false);
    setPreviewLoading(true);
    setPreviewAttempt((a) => a + 1);
  }, []);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const showTab = (tab: Tab) => {
    markOpened(tab);
    setMobileTab(tab);
    if (tab === "preview") setPreviewFresh(false);
    if (tab === "photos") setPhotosWanted(true);
  };

  const showDesk = (tab: SideTab) => {
    markOpened(tab);
    setDeskTab(tab);
    if (tab === "photos") setPhotosWanted(true);
  };
  const showSide = (tab: SideTab) => {
    showTab(tab);
    setDeskTab(tab);
  };
  /** Hands a photo to the chat: the owner only has to say where it goes. */
  const handPhoto = useCallback((name: string) => {
    const line = t.photoUseText.replace("{name}", name);
    setDraft((d) => (d.trim() ? `${d.trimEnd()}\n${line}` : line));
    setMobileTab("chat");
    setFocusChat((k) => k + 1);
  }, [t.photoUseText]);

  const restore = useCallback(
    async (number: number): Promise<boolean> => {
      const res = await fetch(`/api/projects/${projectId}/versions/${number}/restore`, { method: "POST" });
      if (!res.ok) return false;
      const data: { version: { number: number }; versions: UiVersion[] } = await res.json();
      setVersions(data.versions.map((v) => ({ ...v, createdAt: String(v.createdAt) })));
      setCurrent(data.version.number);
      setReloadKey((k) => k + 1);
      addAssistant(t.versionRestoredFrom.replace("{n}", String(number)), { versionNumber: data.version.number, restored: true });
      return true;
    },
    [projectId, t, addAssistant],
  );


  // The version shown before the newest one: what "Undo this change" goes back to.
  const previous = versions.length > 1 && versions[0]?.number === current ? versions[1]!.number : null;
  const undo = useCallback(async () => {
    if (previous === null) return;
    if (!(await restore(previous).catch(() => false))) addAssistant(t.versionRestoreFailed, { tone: "error" });
    // The button is gone with the change: keyboard focus goes to the message box.
    setFocusChat((k) => k + 1);
  }, [previous, restore, addAssistant, t.versionRestoreFailed]);

  /** Takes the waiting request out of the chat (it was never run or saved). */
  const dropPending = useCallback(() => {
    if (!confirm) return;
    setMessages((m) => {
      const i = m.findLastIndex((x) => x.role === "owner" && x.text === confirm.text);
      return i >= 0 ? [...m.slice(0, i), ...m.slice(i + 1)] : m;
    });
    setConfirm(null);
  }, [confirm]);

  /** "Make it smaller": the request goes back into the message box, unsent and unpaid. */
  const smaller = useCallback(() => {
    if (!confirm) return;
    dropPending();
    setDraft(confirm.text);
    addAssistant(t.confirmSmallerHint);
    setFocusChat((k) => k + 1);
  }, [confirm, dropPending, addAssistant, t.confirmSmallerHint]);

  const chat = (
    <ChatPanel
      confirm={confirm ? { ...confirm, onGo: () => {
        void send(confirm.text, confirm.languages, { size: confirm.size, cost: confirm.cost });
        // The card goes away: keyboard focus goes to the message box, not the page.
        setFocusChat((k) => k + 1);
      }, onSmaller: smaller, onDiscard: dropPending } : undefined}
      nextGrant={nextGrant}
      paused={paused ? t.paused : undefined}
      onBeforeSend={() => !maybeUpgrade("send", credits, credits)}
      t={t}
      hasSite={versions.length > 0}
      celebrate={celebrate && !liveUrl}
      onSeeSite={() => showTab("preview")}
      onPhotos={() => showSide("photos")}
      draft={draft}
      onDraft={setDraft}
      focusKey={focusChat}
      onAttach={photos.upload}
      photoErrors={photoText.photoErrors}
      onUndo={previous !== null && !paused ? undo : undefined}
      credits={{ left: credits, href: `/${locale}/billing` }}
      messages={messages}
      working={working}
      timeline={timeline}
      onSend={(text) => send(text, siteLanguages)}
      welcome={welcome}
      languages={versions.length === 0 && !working ? { value: siteLanguages, onChange: setSiteLanguages } : undefined}
    />
  );
  const view = previewView({ paused, hasVersion: versions.length > 0, working, firstBuildFailed, url: previewUrl, loading: previewLoading, error: previewError });
  const backToChat = useCallback(() => {
    setMobileTab("chat");
    setFocusChat((k) => k + 1);
  }, []);
  const preview = (
    <PreviewPanel
      t={t}
      view={view}
      url={previewUrl}
      liveUrl={liveUrl}
      working={working}
      // Only the placeholder uses it: later edits don't re-render the frame on every streamed piece.
      timeline={view === "building" ? timeline : null}
      device={device}
      onReload={reload}
      onRetry={retryPreview}
      onBackToChat={backToChat}
      reloadKey={reloadKey}
      warm={firstBuildWarm}
    />
  );
  const versionsPanel = <VersionsPanel t={t} locale={locale} versions={versions} current={current} disabled={working || paused} onRestore={restore} />;
  const code = <CodePanel t={t} projectId={projectId} refreshKey={current ?? 0} />;
  const photosPanel = <PhotosPanel t={t} tp={photoText} projectId={projectId} photos={photos} disabled={working} onUse={handPhoto} />;
  const panels: Record<SideTab, React.ReactNode> = { preview, photos: photosPanel, versions: versionsPanel, code };
  const tabLabels: Record<Tab, string> = { chat: t.tabChat, preview: t.tabPreview, photos: t.tabPhotos, versions: t.tabVersions, code: t.tabCode };

  // Each panel renders once; CSS decides what shows (mobile: one tab, desktop: chat + one tab).
  const panelClass = (tab: Tab) =>
    `min-h-0 flex-1 flex-col ${mobileTab === tab ? "max-lg:flex" : "max-lg:hidden"} ${tab === "chat" || deskTab === tab ? "lg:flex" : "lg:hidden"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PublishBar
        t={t}
        projectId={projectId}
        hasVersion={versions.length > 0}
        disabled={working || paused}
        planHref={`/${locale}/billing`}
        onLive={onLive}
        feedback={{ href: `/${locale}/feedback?from=${encodeURIComponent(`/${locale}/build/${projectId}`)}`, label: chrome.feedbackAfterPublish }}
      >
        {({ status, button }) => <TopBar locale={locale} projectId={projectId} text={chrome} siteName={name} status={status} publish={button} />}
      </PublishBar>
      <TabList
        tabs={["chat", ...SIDE_TABS] as const}
        labels={tabLabels}
        icons={TAB_ICONS}
        badges={{ preview: previewFresh && mobileTab !== "preview" }}
        badgeLabel={t.tabNew}
        active={mobileTab}
        onChange={showTab}
        label={t.viewsLabel}
        idPrefix="tab-m"
        className="flex overflow-x-auto border-b border-line bg-white p-1.5 lg:hidden"
      />
      <main id="main" className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section id="panel-chat" role="tabpanel" aria-label={t.tabChat} className={`${panelClass("chat")} bg-white lg:w-[420px] lg:flex-none lg:border-e lg:border-line xl:w-[460px]`}>
          {chat}
        </section>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col max-lg:contents">
          <div className="hidden min-w-0 items-center gap-3 border-b border-line bg-white px-2 py-1.5 lg:flex">
            <TabList tabs={SIDE_TABS} labels={tabLabels} icons={TAB_ICONS} active={deskTab} onChange={showDesk} label={t.viewsLabel} idPrefix="tab-d" className="flex shrink-0" />
            {deskTab === "preview" && <PreviewControls t={t} url={view === "live" ? previewUrl : null} liveUrl={liveUrl} onReload={reload} device={{ value: device, onChange: setDevice }} className="flex-1 justify-end" />}
          </div>
          {SIDE_TABS.map((tab) => (
            <section key={tab} id={`panel-${tab}`} role="tabpanel" aria-label={tabLabels[tab]} className={panelClass(tab)}>
              {opened.has(tab) && panels[tab]}
            </section>
          ))}
        </div>
      </main>
      {upgradeSeen && <UpgradeDialog open={upgradeOpen} onClose={closeUpgrade} info={upgrade} t={upgradeText} />}
      {/* Large screens only (phones get it on the next page); never while the AI works or beside the upgrade question. */}
      <LazyInstallSheet t={installText} busy={working || upgradeOpen} largeOnly />
    </div>
  );
}
