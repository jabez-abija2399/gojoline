"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Check, ExternalLink, Globe, MessageCircle, QrCode, Send, Share2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { ownerOpen, shareLinks } from "@/lib/dashboard/share";
import { Modal } from "./dialog";

type T = Messages["dashboard"];

// The QR code, its library and the poster drawing load only when the owner opens the dialog.
const QrPanel = dynamic(() => import("./qr-panel").then((m) => m.QrPanel), { ssr: false });

const big = "flex min-h-14 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold transition-colors sm:flex-row sm:gap-2 sm:text-base";
const option = "flex min-h-12 items-center gap-3 rounded-xl border border-line px-4 text-base font-medium hover:bg-sunken";

/** Open, Share and QR code: the three things an owner does with a live site. */
export function LiveActions({ t, href, text, siteName, scan, only }: { t: T; href: string; text: string; siteName: string; /** "Scan to visit" in both languages, for the printed poster. */ scan: string[]; /** Just the QR button (empty states). */ only?: "qr" }) {
  const [sheet, setSheet] = useState<"share" | "qr" | null>(null);
  const qrButton = (
    <button type="button" onClick={() => setSheet("qr")} className={`${big} border border-line bg-white text-ink hover:bg-sunken`}>
      <QrCode aria-hidden="true" className="size-5" />
      {only ? t.showQr : t.qr}
    </button>
  );
  return (
    <>
      {only ? (
        <div className="flex">{qrButton}</div>
      ) : (
        <div className="flex gap-2">
          <a href={ownerOpen(href)} target="_blank" rel="noopener noreferrer" className={`${big} bg-ink text-white hover:bg-ink-hover`}>
            <ExternalLink aria-hidden="true" className="size-5" />
            {t.open}
            <span className="sr-only">{t.newTab}</span>
          </a>
          <button type="button" onClick={() => setSheet("share")} className={`${big} border border-line bg-white text-ink hover:bg-sunken`}>
            <Share2 aria-hidden="true" className="size-5" />
            {t.share}
          </button>
          {qrButton}
        </div>
      )}
      <Modal open={sheet === "share"} onClose={() => setSheet(null)} title={t.shareTitle} closeLabel={t.close} labelId="dash-share-title">
        <ShareOptions t={t} href={href} text={format(t.shareMessage, { name: siteName })} />
      </Modal>
      <Modal open={sheet === "qr"} onClose={() => setSheet(null)} title={t.qrTitle} closeLabel={t.close} labelId="dash-qr-title">
        <QrPanel t={t} href={href} text={text} siteName={siteName} scan={scan} />
      </Modal>
    </>
  );
}

function ShareOptions({ t, href, text }: { t: T; href: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const links = shareLinks(href, text);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <ul className="flex flex-col gap-2">
      {canShare && (
        <li>
          <button type="button" onClick={() => navigator.share({ title: text, url: href }).catch(() => undefined)} className={`${option} w-full`}>
            <Share2 aria-hidden="true" className="size-5" />
            {t.share}
          </button>
        </li>
      )}
      {(
        [
          ["telegram", Send, t.shareTelegram],
          ["whatsapp", MessageCircle, t.shareWhatsApp],
          ["facebook", Globe, t.shareFacebook],
        ] as const
      ).map(([id, Icon, label]) => (
        <li key={id}>
          <a href={links[id]} target="_blank" rel="noopener noreferrer" className={option}>
            <Icon aria-hidden="true" className="size-5" />
            {label}
            <span className="sr-only">{t.newTab}</span>
          </a>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={async () => {
            if (await navigator.clipboard?.writeText(href).then(() => true, () => false)) setCopied(true);
          }}
          className={`${option} w-full`}
        >
          {copied ? <Check aria-hidden="true" className="size-5 text-lagoon" /> : <Copy aria-hidden="true" className="size-5" />}
          {copied ? t.copied : t.copyLink}
        </button>
        <span role="status" className="sr-only">{copied ? t.copied : ""}</span>
      </li>
    </ul>
  );
}
