import { HeadingLevel } from "./components/SectionTitle";
import { SiteProvider } from "./lib/context";
import type { Lang, Page, Section, Site } from "./lib/types";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";
import { Footer } from "./sections/Footer";
import { Form } from "./sections/Form";
import { Gallery } from "./sections/Gallery";
import { Header } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { MapEmbed } from "./sections/MapEmbed";
import { Menu } from "./sections/Menu";
import { Services } from "./sections/Services";
import { Testimonials } from "./sections/Testimonials";

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
    case "form":
      return <Form key={index} section={section} />;
  }
}

export function App({ site, page, lang }: { site: Site; page: Page; lang: Lang }) {
  // A hero renders its own h1; otherwise the first section's heading becomes the h1.
  const firstIsHero = page.sections[0]?.type === "hero";
  return (
    <SiteProvider site={site} page={page} lang={lang}>
      <div className="flex min-h-screen flex-col">
        <Header />
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
    </SiteProvider>
  );
}

export function findPage(site: Site, path: string): Page | undefined {
  return site.pages.find((p) => p.path === path);
}
