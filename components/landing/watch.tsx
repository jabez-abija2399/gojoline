import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideVideo } from "@/components/guide/guide-video";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { POSTER_FILE, VIDEO_FILE, trackSrc } from "@/lib/guide/sections";
import { VIDEO_BYTES } from "@/lib/guide/video";
import { Eyebrow } from "./eyebrow";

/** The guide video on the home page, for visitors who'd like to see it working before signing up. Nothing loads until played. */
export function Watch({ t, g, locale }: { t: Messages["landing"]["watch"]; g: Messages["guide"]["video"]; locale: Locale }) {
  return (
    <section id="watch" aria-labelledby="watch-title" className="mx-auto flex max-w-5xl scroll-mt-24 flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 md:py-24">
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <h2 id="watch-title" className="text-3xl display text-balance sm:text-5xl">{t.title}</h2>
      <p className="max-w-[56ch] text-ink-muted sm:text-lg">{t.body}</p>
      <div className="mt-4 w-full">
        <GuideVideo
          src={VIDEO_FILE}
          poster={POSTER_FILE}
          label={g.label}
          fallback={g.fallback}
          download={format(g.download, { size: format(g.size, { n: (VIDEO_BYTES / 1e6).toFixed(1) }) })}
          tracks={[
            { kind: "captions", src: trackSrc("captions", "en"), srcLang: "en", label: g.captionsEn },
            { kind: "captions", src: trackSrc("captions", "am"), srcLang: "am", label: g.captionsAm, default: locale === "am" },
            { kind: "chapters", src: trackSrc("chapters", locale), srcLang: locale, label: g.chaptersLabel },
          ]}
        />
      </div>
      <p className="text-sm text-ink-muted">{g.length}</p>
      <Link href={`/${locale}/guide`} className="group inline-flex min-h-11 items-center gap-1 font-medium text-link underline-offset-4 hover:underline">
        {t.guideLink}
        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
      </Link>
    </section>
  );
}
