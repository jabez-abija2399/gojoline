"use client";

import { useParams } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { errorMessages } from "@/lib/i18n/messages/errors";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang: string }>();
  const t = errorMessages[isLocale(params.lang) ? params.lang : "en"];
  return (
    <main id="main" className="mx-auto flex max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24">
      <h1 className="text-3xl font-bold">{t.serverTitle}</h1>
      <p className="text-ink-muted">{t.serverBody}</p>
      <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-lg bg-teal px-5 font-medium text-white hover:bg-teal-deep">
        {t.retry}
      </button>
    </main>
  );
}
