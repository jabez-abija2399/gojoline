import Image from "next/image";
import { ArrowRight, Check, Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";

type Box = Messages["landing"]["box"];
interface Site { name: string; prompt: string; shot: { src: string; width: number; height: number } }

/**
 * Inside the hero's frame, option B: the whole story in three phones, left to right. The
 * owner's message, the site being built, the live site with a booking arriving.
 */
export function BoxStory({ site, box, steps, buildTitle, priority, animate }: { site: Site; box: Box; steps: string[]; buildTitle: string; priority: boolean; animate: boolean }) {
  const phone = "relative flex h-[22rem] w-[13.5rem] shrink-0 flex-col overflow-hidden rounded-[2rem] border-[7px] border-ink bg-white text-start text-sm shadow-[0_24px_60px_-28px_rgb(18_18_18/0.5)] sm:h-[26rem] sm:w-[15rem]";
  const label = "mb-3 text-center text-sm font-semibold text-ink";
  const arrow = <ArrowRight className="hidden size-6 shrink-0 self-center text-ink/30 lg:block" />;
  return (
    <div aria-hidden="true" className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-6 sm:justify-center md:gap-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      <div className="snap-center">
        <p className={label}>{box.storyMessage}</p>
        <div className={phone}>
          <div className="border-b border-line px-3 py-2.5 font-semibold">{site.name}</div>
          <div className="flex flex-1 flex-col justify-end gap-2 bg-[radial-gradient(var(--gojo-line)_1px,transparent_1px)] bg-[size:14px_14px] p-3">
            <p className={`ms-auto max-w-[90%] rounded-2xl rounded-br-sm bg-ink px-3 py-2.5 text-white ${animate ? "animate-[rise-in_0.35s_ease-out_backwards]" : ""}`}>{site.prompt}</p>
          </div>
        </div>
      </div>
      {arrow}
      <div className="snap-center">
        <p className={label}>{box.storyBuild}</p>
        <div className={phone}>
          <div className="border-b border-line px-3 py-2.5 font-semibold">{buildTitle}</div>
          <ol className="flex flex-1 flex-col justify-center gap-3 p-4">
            {steps.map((s, i) => (
              <li key={s} className={`flex items-center gap-2.5 ${animate ? "animate-[rise-in_0.35s_ease-out_backwards]" : ""}`} style={{ animationDelay: `${200 + i * 180}ms` }}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lagoon text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-ink-muted">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mx-4 mb-4 h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className="h-full w-full rounded-full bg-lagoon" />
          </div>
        </div>
      </div>
      {arrow}
      <div className="snap-center">
        <p className={label}>{box.storyLive}</p>
        <div className={phone}>
          <div key={site.name} className={`flex-1 overflow-hidden ${animate ? "animate-[pop-in_0.45s_ease-out]" : ""}`}>
            <Image src={site.shot.src} alt="" width={site.shot.width} height={site.shot.height} sizes="240px" priority={priority} className="w-full" />
          </div>
          <div className={`absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl border border-line bg-white p-2.5 shadow-lg ${animate ? "animate-[rise-in_0.4s_0.8s_ease-out_backwards]" : ""}`}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coral-soft text-ink">
              <Send className="size-3.5" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-xs font-semibold">{box.newBooking}</span>
              <span className="truncate text-xs text-ink-muted">{box.bookings[0]?.who} · {box.bookings[0]?.what}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
