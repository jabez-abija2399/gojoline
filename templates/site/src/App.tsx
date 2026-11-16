import { HeadingLevel } from "./components/SectionTitle";
import { SiteProvider } from "./lib/context";
import type { Lang, Page, Section, Site } from "./lib/types";
import { About } from "./sections/About";
import { Cards } from "./sections/Cards";
import { Contact } from "./sections/Contact";
import { Cta } from "./sections/Cta";
import { Faq } from "./sections/Faq";
import { Footer } from "./sections/Footer";
import { Form } from "./sections/Form";
import { Gallery } from "./sections/Gallery";
import { Header } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { Quote } from "./sections/Quote";
import { Schedule } from "./sections/Schedule";
import { Stats } from "./sections/Stats";
import { Steps } from "./sections/Steps";
import { MapEmbed } from "./sections/MapEmbed";
import { Menu } from "./sections/Menu";
import { Services } from "./sections/Services";
import { StickyActions, hasStickyActions } from "./sections/StickyActions";
import { Testimonials } from "./sections/Testimonials";
import { Timeline } from "./sections/Timeline";

function renderSection(section: Section, index: number) {
  switch (section.type) {
    case "hero":
      return <Hero key={index} section={section} first={index === 0} />;
    case "about":
      return <About key={index} section={section} />;
    case "menu":
      return <Menu key={index} section={section} />;
    case "services":
      return <Services key={index} section={section} />;
    case "gallery":
      return <Gallery key={index} section={section} />;
    case "contact":
      return <Contact key={index} section={section} />;
    case "map":
      return <MapEmbed key={index} section={section} />;
    case "testimonials":
      return <Testimonials key={index} section={section} />;
    case "timeline":
      return <Timeline key={index} section={section} />;
    case "faq":
      return <Faq key={index} section={section} />;
    case "cta":
      return <Cta key={index} section={section} />;
    case "form":
      return <Form key={index} section={section} />;
    case "cards":
      return <Cards key={index} section={section} />;
    case "stats":
      return <Stats key={index} section={section} />;
    case "steps":
      return <Steps key={index} section={section} />;
    case "schedule":
      return <Schedule key={index} section={section} />;
    case "quote":
      return <Quote key={index} section={section} />;
  }
}

export function App({ site, page, lang }: { site: Site; page: Page; lang: Lang }) {
  // A hero renders its own h1; otherwise the first section's heading becomes the h1.
  const top = page.sections[0];
  const firstIsHero = top?.type === "hero";
  // A full-screen photo hero carries the header on top of the photo.
  const overlay = top?.type === "hero" && top.variant === "immersive" && Boolean(top.image?.src);
  return (
    <SiteProvider site={site} page={page} lang={lang}>
      {/* Room at the bottom on phones so the call bar never hides the footer's last line. */}
      <div data-style={site.theme.style ?? "warm"} className={`site-root relative flex min-h-screen flex-col ${hasStickyActions(site) ? "max-md:pb-[4.5rem]" : ""}`}>
        <Header overlay={overlay} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {page.sections.map((section, i) =>
            i === 0 && !firstIsHero ? (
              <HeadingLevel.Provider key={i} value={1}>
                {renderSection(section, i)}
              </HeadingLevel.Provider>
            ) : (
              renderSection(section, i)
            ),
          )}
        </main>
        <Footer />
      </div>
      <StickyActions />
    </SiteProvider>
  );
}

export function findPage(site: Site, path: string): Page | undefined {
  return site.pages.find((p) => p.path === path);
}
