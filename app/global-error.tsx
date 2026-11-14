"use client";

import { am } from "@/lib/i18n/messages/am";
import { en } from "@/lib/i18n/messages/en";

// Last-resort boundary when the root layout itself fails. Shows both languages.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FFF7F0", color: "#1C1917", padding: 24 }}>
        <main>
          <h1>{en.errors.serverTitle}</h1>
          <p>{en.errors.serverBody}</p>
          <p lang="am">{am.errors.serverBody}</p>
          <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 20px" }}>
            {en.errors.retry} / <span lang="am">{am.errors.retry}</span>
          </button>
        </main>
      </body>
    </html>
  );
}
