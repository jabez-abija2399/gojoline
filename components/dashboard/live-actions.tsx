"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Download, ExternalLink, Globe, MessageCircle, QrCode, Send, Share2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { ownerOpen, posterName, qrTarget, shareLinks } from "@/lib/dashboard/share";
import { Modal } from "./dialog";

type T = Messages["dashboard"];
type Matrix = boolean[][];

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
      <Modal open={sheet === "share"} onClose={() => setSheet(null)} title={t.shareTitle} closeLabel={t.close} labelId="share-title">
        <ShareOptions t={t} href={href} text={format(t.shareMessage, { name: siteName })} />
      </Modal>
      <Modal open={sheet === "qr"} onClose={() => setSheet(null)} title={t.qrTitle} closeLabel={t.close} labelId="qr-title">
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

/** The QR code is made in the browser (the library loads only when the owner opens this). */
function QrPanel({ t, href, text, siteName, scan }: { t: T; href: string; text: string; siteName: string; scan: string[] }) {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    import("uqr")
      .then(({ encode }) => live && setMatrix(encode(qrTarget(href), { ecc: "M", border: 2 }).data))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [href]);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-muted">{t.qrBody}</p>
      <div className="mx-auto flex aspect-square w-full max-w-64 items-center justify-center rounded-xl border border-line bg-[#fff] p-2">
        {matrix ? <QrSvg matrix={matrix} label={format(t.qrAlt, { address: text })} /> : failed ? <p role="alert" className="text-center text-sm text-ink-muted">{t.loadError}</p> : <p role="status" className="text-center text-sm text-ink-muted">{t.qrMaking}</p>}
      </div>
      <p className="break-all text-center font-medium">{text}</p>
      <button type="button" disabled={!matrix} onClick={() => matrix && void downloadPoster(matrix, siteName, scan, text)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-4 font-semibold text-white hover:bg-ink-hover disabled:opacity-50">
        <Download aria-hidden="true" className="size-5" />
        {t.qrDownload}
      </button>
    </div>
  );
}

function QrSvg({ matrix, label }: { matrix: Matrix; label: string }) {
  const n = matrix.length;
  let d = "";
  matrix.forEach((row, y) => row.forEach((on, x) => on && (d += `M${x} ${y}h1v1h-1z`)));
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" className="size-full">
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#121212" />
    </svg>
  );
}

/** A4 at 150 dpi: site name, "Scan to visit" (English and Amharic), the code, the address. */
async function downloadPoster(matrix: Matrix, siteName: string, scan: string[], address: string) {
  const W = 1240;
  const H = 1754;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return;
  await document.fonts?.ready;
  const font = getComputedStyle(document.body).fontFamily;
  g.fillStyle = "#FBF9F6";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#121212";
  g.textAlign = "center";
  const fit = (text: string, weight: number, size: number, y: number) => {
    let s = size;
    do g.font = `${weight} ${s}px ${font}`;
    while (g.measureText(text).width > W - 160 && (s -= 4) > 24);
    g.fillText(text, W / 2, y);
  };
  fit(siteName, 700, 96, 220);
  scan.forEach((line, i) => fit(line, 600, 64, 340 + i * 84));
  const n = matrix.length;
  const size = 860;
  const cell = Math.floor(size / n);
  const x0 = (W - cell * n) / 2;
  const y0 = 470;
  g.fillStyle = "#FFFFFF";
  g.fillRect(x0 - 24, y0 - 24, cell * n + 48, cell * n + 48);
  g.fillStyle = "#121212";
  matrix.forEach((row, y) => row.forEach((on, x) => on && g.fillRect(x0 + x * cell, y0 + y * cell, cell, cell)));
  fit(address, 600, 56, y0 + cell * n + 140);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = posterName(siteName);
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
