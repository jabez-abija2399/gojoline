import Image from "next/image";
import { Check, Globe, Images, Inbox, LayoutDashboard, ListOrdered, Send, Wallet, Languages } from "lucide-react";
import type { Messages } from "@/lib/i18n";

type Box = Messages["landing"]["box"];
interface Site { name: string; shot: { src: string; width: number; height: number } }

/**
 * Inside the hero's frame, option A: the owner's Gojoline workspace, as the reference shows its
 * product. A sidebar, the live site with its address, answers coming in, and what every page
 * gets. Decoration (the figure has its own description), drawn with the product's own pieces.
 */
export function BoxWorkspace({ site, box, slug, priority, animate }: { site: Site; box: Box; slug: string; priority: boolean; animate: boolean }) {
  const nav = [
    { icon: LayoutDashboard, label: box.overview, active: true },
    { icon: Inbox, label: box.answers, count: 3 },
    { icon: ListOrdered, label: box.prices },
    { icon: Images, label: box.photos },
    { icon: Send, label: box.telegram },
  ];
  const sharedIcons = [Inbox, Send, Languages, Wallet];
  return (
    <div aria-hidden="true" className="relative grid overflow-hidden rounded-2xl border border-ink/10 bg-white text-start text-sm shadow-[0_30px_80px_-30px_rgb(18_18_18/0.45)] md:grid-cols-[13rem_1fr] md:rounded-b-none md:border-b-0 lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col gap-1 border-line bg-paper p-3 max-md:hidden md:border-e">
        <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-ink font-display text-xs font-bold text-white">{[...site.name][0]}</span>
          <span className="truncate font-semibold">{site.name}</span>
        </div>
        {nav.map((n) => (
          <span key={n.label} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${n.active ? "bg-white font-semibold shadow-sm ring-1 ring-line" : "text-ink-muted"}`}>
            <n.icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{n.label}</span>
            {n.count ? <span className="rounded-full bg-ink px-1.5 text-xs font-semibold text-white">{n.count}</span> : null}
          </span>
        ))}
      </aside>
      <div className="flex min-w-0 flex-col gap-3 bg-white p-3 sm:p-5">
        <div className="flex items-center gap-2 text-ink-muted">
          <LayoutDashboard className="size-4" />
          <span className="font-medium text-ink">{box.overview}</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          {/* The live site: its real picture, its address. */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-line">
            <div key={site.name} className={`relative h-44 overflow-hidden bg-sunken sm:h-52 ${animate ? "animate-[pop-in_0.45s_ease-out]" : ""}`}>
              <Image src={site.shot.src} alt="" width={site.shot.width} height={site.shot.height} sizes="(min-width: 1024px) 380px, 90vw" priority={priority} className="w-full object-cover object-top" />
            </div>
            <div className="flex items-center gap-3 border-t border-line p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-coral-soft text-ink">
                <Globe className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 font-semibold">
                  {box.yourSite}
                  <span className="inline-flex items-center gap-1 rounded-full border border-lagoon px-1.5 text-xs font-semibold text-lagoon">
                    <span className="size-1.5 rounded-full bg-lagoon" />
                    {box.live}
                  </span>
                </span>
                <span className="truncate text-ink-muted">{slug}.gojoline.site</span>
              </span>
            </div>
          </div>
          {/* Answers arriving. */}
          <div className="flex flex-col rounded-xl border border-line p-3">
            <span className="mb-1 font-semibold">{box.latest}</span>
            <ul className="flex flex-col divide-y divide-line">
              {box.bookings.map((b, i) => (
                <li key={b.who} className={`flex items-center gap-2.5 py-2 ${animate ? "animate-[rise-in_0.35s_ease-out_backwards]" : ""}`} style={{ animationDelay: `${300 + i * 150}ms` }}>
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-coral-soft text-ink" : "bg-sunken text-ink-muted"}`}>{[...b.who][0]}</span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="font-medium">{b.who}</span>
                    <span className="truncate text-xs text-ink-muted">{b.what}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">{b.when}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* What every page gets, as the reference's "shared by every app" row. */}
        <div className="rounded-xl bg-sunken p-2.5 max-sm:hidden">
          <span className="mb-2 block px-1 text-xs font-medium text-ink-muted">{box.shared}</span>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {box.sharedItems.map((it, i) => {
              const Icon = sharedIcons[i] ?? Check;
              return (
                <span key={it.title} className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-paper text-ink ring-1 ring-line">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="font-semibold">{it.title}</span>
                    <span className="text-xs text-ink-muted">{it.body}</span>
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
