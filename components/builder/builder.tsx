"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { ChatPanel, type UiMessage } from "./chat-panel";
import { CodePanel } from "./code-panel";
import { PreviewPanel } from "./preview-panel";
import { PublishBar } from "./publish-bar";
import { TabList } from "./tab-list";
import { VersionsPanel, type UiVersion } from "./versions-panel";

type Tab = "chat" | "preview" | "versions" | "code";
type Step = "reading" | "editing" | "checking" | "fixing" | null;

interface Props {
  noCredits: { text: string; action: string };
  locale: Locale;
  projectId: string;
  t: Messages["builder"];
  initialMessages: UiMessage[];
  initialVersions: UiVersion[];
}

let localId = 0;
const nextId = () => `local-${++localId}`;

export function Builder({ locale, projectId, t, initialMessages, initialVersions, noCredits }: Props) {
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [versions, setVersions] = useState<UiVersion[]>(initialVersions);
  const [current, setCurrent] = useState<number | null>(initialVersions[0]?.number ?? null);
  const [working, setWorking] = useState(false);
  const [step, setStep] = useState<Step>(null);
  const [streamText, setStreamText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(initialVersions.length > 0);
  const [previewError, setPreviewError] = useState(false);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<Tab>("chat");
  const [deskTab, setDeskTab] = useState<Exclude<Tab, "chat">>("preview");
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
    async (text: string) => {
      setMessages((m) => [...m, { id: nextId(), role: "owner", text }]);
      setWorking(true);
      setStep(null);
      setStreamText("");
      lastBuildFailed.current = false;
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
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
                break;
              case "tool":
                setStep(event.name === "run_build" ? "checking" : event.name === "read_file" || event.name === "list_files" ? "reading" : lastBuildFailed.current ? "fixing" : "editing");
                break;
              case "build":
                lastBuildFailed.current = !event.ok;
                if (event.ok) setReloadKey((k) => k + 1);
                break;
              case "done": {
                finished = true;
                const m = event.message;
                if (m.status === "failed") addAssistant(t.reverted, { tone: "error" });
                else addAssistant(m.text, { versionNumber: m.versionNumber });
                if (m.versionNumber) {
                  setVersions((v) => [{ number: m.versionNumber, summary: text.slice(0, 140), createdAt: new Date().toISOString() }, ...v]);
                  setCurrent(m.versionNumber);
                  setReloadKey((k) => k + 1);
                }
                break;
              }
              case "error":
                finished = true;
                if (event.code === "no_credits") addAssistant(noCredits.text, { tone: "error", action: { href: `/${locale}/billing`, label: noCredits.action } });
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
        setStep(null);
        setStreamText("");
      }
    },
    [projectId, t, addAssistant, noCredits, locale],
  );

  const restore = useCallback(
    async (number: number): Promise<boolean> => {
      const res = await fetch(`/api/projects/${projectId}/versions/${number}/restore`, { method: "POST" });
      if (!res.ok) return false;
      const data: { version: { number: number }; versions: UiVersion[] } = await res.json();
      setVersions(data.versions.map((v) => ({ ...v, createdAt: String(v.createdAt) })));
      setCurrent(data.version.number);
      setReloadKey((k) => k + 1);
      addAssistant(t.versionRestoredFrom.replace("{n}", String(number)), { versionNumber: data.version.number });
      return true;
    },
    [projectId, t, addAssistant],
  );

  const stepLabel = step === "reading" ? t.stepReading : step === "editing" ? t.stepEditing : step === "checking" ? t.stepChecking : step === "fixing" ? t.stepFixing : null;

  const chat = <ChatPanel t={t} locale={locale} messages={messages} working={working} stepLabel={stepLabel} streamText={streamText} onSend={send} />;
  const preview = (
    <PreviewPanel
      t={t}
      url={previewUrl}
      loading={previewLoading || (working && !previewUrl)}
      error={previewError && !previewUrl}
      onRetry={() => {
        setPreviewError(false);
        setPreviewLoading(true);
        setPreviewAttempt((a) => a + 1);
      }}
      reloadKey={reloadKey}
    />
  );
  const versionsPanel = <VersionsPanel t={t} versions={versions} current={current} disabled={working} onRestore={restore} />;
  const code = <CodePanel t={t} projectId={projectId} refreshKey={current ?? 0} />;
  const panels: Record<Exclude<Tab, "chat">, React.ReactNode> = { preview, versions: versionsPanel, code };
  const tabLabels: Record<Tab, string> = { chat: t.tabChat, preview: t.tabPreview, versions: t.tabVersions, code: t.tabCode };

  // Each panel renders once; CSS decides what shows (mobile: one tab, desktop: chat + one tab).
  const panelClass = (tab: Tab) =>
    `min-h-0 flex-1 flex-col ${mobileTab === tab ? "max-lg:flex" : "max-lg:hidden"} ${tab === "chat" || deskTab === tab ? "lg:flex" : "lg:hidden"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PublishBar t={t} projectId={projectId} hasVersion={versions.length > 0} disabled={working} />
      <TabList tabs={["chat", "preview", "versions", "code"] as const} labels={tabLabels} active={mobileTab} onChange={setMobileTab} label={t.viewsLabel} idPrefix="tab-m" className="flex lg:hidden" />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section id="panel-chat" role="tabpanel" aria-label={t.tabChat} className={`${panelClass("chat")} bg-white lg:w-[420px] lg:flex-none lg:border-r lg:border-line`}>
          {chat}
        </section>
        <div className="flex min-h-0 flex-1 flex-col max-lg:contents">
          <TabList tabs={["preview", "versions", "code"] as const} labels={tabLabels} active={deskTab} onChange={setDeskTab} label={t.viewsLabel} idPrefix="tab-d" className="hidden lg:flex" />
          {(["preview", "versions", "code"] as const).map((tab) => (
            <section key={tab} id={`panel-${tab}`} role="tabpanel" aria-label={tabLabels[tab]} className={panelClass(tab)}>
              {panels[tab]}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
