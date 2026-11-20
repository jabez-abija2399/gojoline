import { BedDouble, Gem, PenTool, Briefcase, Cake, Camera, Car, Dumbbell, Pill, BookOpen, Church, Coffee, GraduationCap, HardHat, HeartHandshake, House, MoonStar, Mountain, PartyPopper, Scissors, Shirt, ShoppingBag, Stethoscope, UserRound } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { MarqueeToggle } from "./marquee-toggle";

const ICONS = { cafe: Coffee, hotel: BedDouble, clinic: Stethoscope, school: GraduationCap, shop: ShoppingBag, worship: Church, mosque: MoonStar, events: PartyPopper, ngo: HeartHandshake, "real-estate": House, tours: Mountain, personal: UserRound, business: Briefcase, salon: Scissors, fashion: Shirt, construction: HardHat, garage: Car, bakery: Cake, studio: Camera, training: BookOpen, pharmacy: Pill, gym: Dumbbell, resort: Gem, agency: PenTool } as const;

/**
 * Every kind of business Gojoline has a template for, drifting by. CSS only: the list is drawn
 * twice so the loop is seamless; it pauses under a pointer or focus and stands still (wrapped)
 * for people who prefer less motion. Screen readers get the list once.
 */
export function Marquee({ title, names, pause }: { title: string; names: Messages["builder"]["templates"]; /** "Pause the moving list". */ pause: string }) {
  const items = (Object.keys(ICONS) as (keyof typeof ICONS)[]).filter((k) => k in names);
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="marquee-row flex shrink-0 gap-3 pe-3">
      {items.map((k) => {
        const Icon = ICONS[k];
        return (
          <li key={k} className="flex shrink-0 items-center gap-2.5 px-3 py-2 font-medium whitespace-nowrap text-ink">
            <span className="flex size-8 items-center justify-center rounded-full bg-coral-soft text-ink">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            {names[k as keyof typeof names]}
          </li>
        );
      })}
    </ul>
  );
  return (
    <section aria-labelledby="marquee-title" className="overflow-hidden py-12 md:py-16 below-fold">
      <h2 id="marquee-title" className="mb-6 px-4 text-center font-medium text-ink-muted">
        {title}
      </h2>
      <MarqueeToggle label={pause}>
        <div className="marquee group relative flex w-full [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          {row(false)}
          {row(true)}
        </div>
      </MarqueeToggle>
    </section>
  );
}
