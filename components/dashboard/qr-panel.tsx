"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { posterName, qrTarget } from "@/lib/dashboard/share";
import { Address } from "./address";

type T = Messages["dashboard"];
type Matrix = boolean[][];

/*
 * Colours here are fixed on purpose, not theme tokens: a QR code only scans as dark modules on a
 * light ground, so the code and the printed poster stay ink on white/paper in dark mode too.
 */

/** The QR code is made in the browser (the library loads only when the owner opens this). */
export function QrPanel({ t, href, text, siteName, scan }: { t: T; href: string; text: string; siteName: string; scan: string[] }) {
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
      <p className="text-center font-medium"><Address text={text} /></p>
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
  const size = 820;
  const cell = Math.floor(size / n);
  const x0 = Math.round((W - cell * n) / 2);
  const y0 = 520;
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
