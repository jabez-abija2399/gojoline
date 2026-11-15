"use client";

import { errorMessages } from "@/lib/i18n/messages/errors";

// Last-resort boundary when the root layout itself fails. Shows both languages.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FBF9F6", color: "#121212", padding: 24 }}>
        <main>
          <h1>{errorMessages.en.serverTitle}</h1>
          <p>{errorMessages.en.serverBody}</p>
          <p lang="am">{errorMessages.am.serverBody}</p>
          <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 20px" }}>
            {errorMessages.en.retry} / <span lang="am">{errorMessages.am.retry}</span>
          </button>
        </main>
      </body>
    </html>
  );
}
