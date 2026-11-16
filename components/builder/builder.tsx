"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FileText, History, Images, MessageCircle } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { nextTimeline, type Timeline } from "./build-timeline";
import { ChatPanel, type UiMessage } from "./chat-panel";
import type { SiteLanguages } from "./language-choice";
import type { PhotoText } from "./photos-panel";
import { PreviewControls, PreviewPanel, type Device } from "./preview-panel";
import { PublishBar } from "./publish-bar";
import { takeStartPrompt } from "./start-prompt";
import { TabList } from "./tab-list";
import { TopBar, type TopBarText } from "./top-bar";
import { usePhotos } from "./use-photos";
import { format } from "@/lib/i18n/format";

/** "Used 2 changes · 18 left" under an AI answer (a free first build says so). */
function usageNote(t: Messages["builder"], charged: number, left: number, firstBuild: boolean): string {
  if (charged === 0) return format(firstBuild ? t.usedFree : t.usedNone, { left });
  return format(charged === 1 ? t.usedOne : t.usedMany, { n: charged, left });
}
import type { UiVersion } from "./versions-panel";

// Opened now and then, not on every visit: their code loads the first time they are shown.
const VersionsPanel = dynamic(() => import("./versions-panel").then((m) => m.VersionsPanel));
const PhotosPanel = dynamic(() => import("./photos-panel").then((m) => m.PhotosPanel));
const CodePanel = dynamic(() => import("./code-panel").then((m) => m.CodePanel));

type Tab = "chat" | "preview" | "photos" | "versions" | "code";
type SideTab = Exclude<Tab, "chat">;
const SIDE_TABS = ["preview", "photos", "versions", "code"] as const;
const TAB_ICONS = { chat: MessageCircle, preview: Eye, photos: Images, versions: History, code: FileText };

interface Props {
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

export function Builder({ locale, projectId, t, chrome, photoText, siteName, initialMessages, initialVersions, initialCredits, noCredits, nextGrant }: Props) {
  const [credits, setCredits] = useState<number | null>(initialCredits);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
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
  const [streamText, setStreamText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(initialVersions.length > 0);
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

  // Wake the sandbox for an existing site so the preview shows straight away.
  useEffect(() => {
    if (initialVersions.length === 0) return;
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
  }, [projectId, initialVersions.length, previewAttempt]);

  const addAssistant = useCallback((text: string, extra: Partial<UiMessage> = {}) => {
    setMessages((m) => [...m, { id: nextId(), role: "assistant", text, ...extra }]);
  }, []);

  const send = useCallback(
    async (text: string, languages: SiteLanguages, confirmed?: { size: PendingConfirm["size"]; cost: number }) => {
      // Going ahead with a bigger request: its message is already in the chat.
      if (!confirmed) setMessages((m) => [...m, { id: nextId(), role: "owner", text }]);
      setConfirm(null);
      setWorking(true);
      setTimeline({ steps: [{ key: "understand", done: false }], edits: 0, startedAt: Date.now() });
      setStreamText("");
      lastBuildFailed.current = false;
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
              case "text":
                setStreamText((s) => s + event.delta);
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                break;
              case "tool":
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                break;
              case "build":
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                lastBuildFailed.current = !event.ok;
                if (event.ok) setReloadKey((k) => k + 1);
                break;
              case "needs_confirm":
                // Nothing ran: the owner sees the cost and decides.
                finished = true;
                if (typeof event.credits === "number") setCredits(event.credits);
                setConfirm({ text, languages, size: event.size, cost: event.cost, left: event.credits });
                break;
              case "done": {
                finished = true;
                // The server's count after charging (and any refund), so it is never guessed.
                if (typeof event.credits === "number") setCredits(event.credits);
                setTimeline((tl) => (tl ? nextTimeline(tl, event) : tl));
                const m = event.message;
                const usage = typeof event.charged === "number" && typeof event.credits === "number" ? usageNote(t, event.charged, event.credits, versionsRef.current === 0 && m.status === "changed") : undefined;
                if (m.status === "failed") addAssistant(event.tooBig ? t.tooBigFailed : t.reverted, { tone: "error", usage });
                else addAssistant(event.tooBig ? [m.text, t.tooBigPartial].filter(Boolean).join("\n\n") : m.text, { versionNumber: m.versionNumber, usage });
                if (typeof event.siteName === "string" && event.siteName) setName(event.siteName);
                if (m.versionNumber) {
                  if (versionsRef.current === 0) setCelebrate(true);
                  setPreviewFresh(true);
                  versionsRef.current += 1;
                  setVersions((v) => [{ number: m.versionNumber, summary: text.slice(0, 140), createdAt: new Date().toISOString() }, ...v]);
                  setCurrent(m.versionNumber);
                  setReloadKey((k) => k + 1);
                }
                break;
              }
              case "error":
                finished = true;
                if (typeof event.credits === "number") setCredits(event.credits);
                if (event.code === "no_credits") {
                  // Not enough for this request (but some left): say what it needs; none left: say so.
                  const some = typeof event.cost === "number" && (event.credits ?? 0) > 0;
                  addAssistant(some ? format(t.notEnough, { cost: event.cost, left: event.credits }) : noCredits.text, { tone: "error", action: { href: `/${locale}/billing`, label: noCredits.action } });
                }
                // A refusal is a normal answer, not a system failure.
                else if (event.code === "blocked") addAssistant(t.blocked);
                else addAssistant(event.code === "busy" ? t.busy : t.failed, { tone: "error" });
                break;
            }
          }
        }
        if (!finished) addAssistant(t.failed, { tone: "error" });
      } catch {
        addAssistant(t.failed, { tone: "error" });
      } finally {
        setWorking(false);
        setTimeline(null);
        setStreamText("");
      }
    },
    [projectId, t, addAssistant, noCredits, locale],
  );

  // A description typed on "Your sites" starts the build as soon as the new site opens.
  useEffect(() => {
    if (initialMessages.length > 0 || initialVersions.length > 0) return;
    // After hydration, and only once: the prompt is removed from storage as it is read.
    const id = setTimeout(() => {
      const start = takeStartPrompt();
      if (start) void send(start.text, start.languages);
    }, 0);
    return () => clearTimeout(id);
  }, [initialMessages.length, initialVersions.length, send]);

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
      onUndo={previous !== null ? undo : undefined}
      credits={{ left: credits, href: `/${locale}/billing` }}
      messages={messages}
      working={working}
      timeline={timeline}
      streamText={streamText}
      onSend={(text) => send(text, siteLanguages)}
      welcome={welcome}
      languages={versions.length === 0 && !working ? { value: siteLanguages, onChange: setSiteLanguages } : undefined}
    />
  );
  const preview = (
    <PreviewPanel
      t={t}
      url={previewUrl}
      liveUrl={liveUrl}
      working={working}
      device={device}
      onReload={reload}
      loading={previewLoading || (working && !previewUrl)}
      error={previewError && !previewUrl}
      onRetry={retryPreview}
      reloadKey={reloadKey}
    />
  );
  const versionsPanel = <VersionsPanel t={t} locale={locale} versions={versions} current={current} disabled={working} onRestore={restore} />;
  const code = <CodePanel t={t} projectId={projectId} refreshKey={current ?? 0} />;
  const photosPanel = <PhotosPanel t={t} tp={photoText} projectId={projectId} photos={photos} disabled={working} onUse={handPhoto} />;
  const panels: Record<SideTab, React.ReactNode> = { preview, photos: photosPanel, versions: versionsPanel, code };
  const tabLabels: Record<Tab, string> = { chat: t.tabChat, preview: t.tabPreview, photos: t.tabPhotos, versions: t.tabVersions, code: t.tabCode };

  // Each panel renders once; CSS decides what shows (mobile: one tab, desktop: chat + one tab).
  const panelClass = (tab: Tab) =>
    `min-h-0 flex-1 flex-col ${mobileTab === tab ? "max-lg:flex" : "max-lg:hidden"} ${tab === "chat" || deskTab === tab ? "lg:flex" : "lg:hidden"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PublishBar t={t} projectId={projectId} hasVersion={versions.length > 0} disabled={working} onLive={setLiveUrl}>
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
            {deskTab === "preview" && <PreviewControls t={t} url={previewUrl} liveUrl={liveUrl} onReload={reload} device={{ value: device, onChange: setDevice }} className="flex-1 justify-end" />}
          </div>
          {SIDE_TABS.map((tab) => (
            <section key={tab} id={`panel-${tab}`} role="tabpanel" aria-label={tabLabels[tab]} className={panelClass(tab)}>
              {opened.has(tab) && panels[tab]}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
