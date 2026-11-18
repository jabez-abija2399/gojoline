# Fonts in public/fonts

All are open fonts under the SIL Open Font License 1.1 (https://openfontlicense.org), which allows bundling them in websites.

| File | Font | Used for |
| --- | --- | --- |
| `fraunces-latin.woff2` | Fraunces (weights 500 to 700, Latin) | Headings, `theme.font: "classic"` |
| `outfit-latin.woff2` | Outfit (weights 500 to 700, Latin) | Headings, `theme.font: "modern"` |
| `nunito-latin.woff2` | Nunito (weights 600 to 800, Latin) | Headings, `theme.font: "friendly"` |
| `cormorant-latin.woff2` | Cormorant Garamond (weights 500 to 700, Latin) | Headings, `theme.font: "elegant"` |
| `bricolage-latin.woff2` | Bricolage Grotesque (weights 600 to 800, Latin) | Headings, `theme.font: "grotesk"` |
| `archivo-latin.woff2` | Archivo (weights 700 to 900, widths 75% to 100%, Latin) | Headings, `theme.font: "condensed"` |
| `newsreader-latin.woff2` | Newsreader (weights 400 to 600, optical size 48, Latin) | Headings, `theme.font: "editorial"` |
| `noto-sans-ethiopic-core.woff2` | Noto Sans Ethiopic (core Ge'ez subset) | Amharic text |
| `noto-sans-ethiopic-narrow.woff2` | Noto Sans Ethiopic, one narrow heavy cut (width 75%, weight 800, Ge'ez only) | Amharic headings of `condensed` sites only |

A browser downloads only the one heading font a site uses (on Amharic pages of a `condensed` site, the narrow Ge'ez cut instead). Body text uses the visitor's system font. The narrow Ge'ez cut is a separate 50 KB file because keeping the width axis in the main Ge'ez file would double it to 164 KB on every Amharic page.
