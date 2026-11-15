import { BedDouble, Church, Coffee, GraduationCap, HeartHandshake, House, MoonStar, Mountain, PartyPopper, ShoppingBag, Stethoscope } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

const ICONS = { cafe: Coffee, hotel: BedDouble, clinic: Stethoscope, school: GraduationCap, shop: ShoppingBag, worship: Church, mosque: MoonStar, events: PartyPopper, ngo: HeartHandshake, "real-estate": House, tours: Mountain } as const;

export function Templates({ t, names, locale }: { t: Messages["landing"]["templates"]; names: Record<keyof typeof ICONS, string>; locale: Locale }) {
  const href = `/${locale}/sign-in?next=/${locale}/build`;
  return (
    <section aria-labelledby="templates-title" className="bg-teal text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h2 id="templates-title" className="text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
        <p className="mt-2 max-w-[60ch] text-lg text-teal-soft">{t.intro}</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id) => {
            const Icon = ICONS[id];
            return (
              <li key={id}>
                <Link href={href} className="reveal group flex min-h-16 items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10">
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-clay-light transition group-hover:scale-110" />
                  {names[id]}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
