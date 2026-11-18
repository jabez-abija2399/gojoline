/** Structured data for a sector page: the page itself and its questions (FAQPage). "<" is escaped so it can't close the script tag. */
export function sectorJsonLd(p: { url: string; lang: "en" | "am"; headline: string; description: string; faq: { q: string; a: string }[] }): string {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": p.url, url: p.url, name: p.headline, description: p.description, inLanguage: p.lang, isPartOf: { "@type": "WebSite", name: "Gojoline" } },
      { "@type": "FAQPage", "@id": `${p.url}#faq`, inLanguage: p.lang, mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
