"""Size-matched fallback metrics for the site template's Latin heading fonts (templates/site/src/design.css).

Compares each bundled font, instanced at weights 500 and 700, with Arial or Times (Liberation Sans and
Liberation Serif are metric-compatible) over sample heading text, and prints the "<Font> Fallback" @font-face
rules to paste into design.css. Archivo is left out: it falls back to Arial Narrow and changes width
per style.

Run from the repository root: python3 scripts/font-fallbacks.py (needs fontTools and brotli).
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = "templates/site/public/fonts/"
LIBERATION = "/usr/share/fonts/truetype/liberation/"
SAMPLE = "Your neighbourhood pharmacy Cakes for every celebration Train harder Pass your exam with confidence Rooms with a view of the lake See the menu Book a table"
# (family, file, Arial- or Times-like)
HEADINGS = [
    ("Outfit", "outfit", "sans"),
    ("Bricolage Grotesque", "bricolage", "sans"),
    ("Nunito", "nunito", "sans"),
    ("Fraunces", "fraunces", "serif"),
    ("Cormorant Garamond", "cormorant", "serif"),
    ("Newsreader", "newsreader", "serif"),
]


def load(path, weight=None):
    font = TTFont(path)
    if "fvar" in font and weight:
        lo, _, hi = next((a.minValue, a.defaultValue, a.maxValue) for a in font["fvar"].axes if a.axisTag == "wght")
        font = instancer.instantiateVariableFont(font, {"wght": max(lo, min(weight, hi))})
    return font


def average_width(font):
    cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
    return sum(hmtx[cmap[ord(c)]][0] for c in SAMPLE if ord(c) in cmap) / upm / len(SAMPLE)


SOURCES = {
    "sans": ('local("Arial"), local("ArialMT"), local("Liberation Sans"), local("Roboto"), local("Roboto-Regular")', 'local("Arial Bold"), local("Arial-BoldMT"), local("Liberation Sans Bold"), local("Roboto Bold"), local("Roboto-Bold")'),
    "serif": ('local("Times New Roman"), local("TimesNewRomanPSMT"), local("Liberation Serif"), local("Noto Serif")', 'local("Times New Roman Bold"), local("TimesNewRomanPS-BoldMT"), local("Liberation Serif Bold"), local("Noto Serif Bold")'),
}
# Two weight bands per font: light headings (up to 549) against the regular stand-in measured at 500,
# bold ones against the bold stand-in measured at 700, so each band keeps the real font's line breaks.
BANDS = [("100 549", 500, 0, "Regular"), ("550 900", 700, 1, "Bold")]
css = []
for family, file, kind in HEADINGS:
    for weights, at, src, style in BANDS:
        stand_in = load(f"{LIBERATION}Liberation{'Sans' if kind == 'sans' else 'Serif'}-{style}.ttf")
        font = load(f"{FONTS}{file}-latin.woff2", at)
        scale = average_width(font) / average_width(stand_in)
        upm, hhea = font["head"].unitsPerEm, font["hhea"]
        pct = lambda v: f"{v / upm / scale * 100:.1f}%"
        css.append(f"""@font-face {{
  font-family: "{family} Fallback";
  src: {SOURCES[kind][src]};
  font-weight: {weights};
  size-adjust: {scale * 100:.1f}%;
  ascent-override: {pct(hhea.ascent)};
  descent-override: {pct(-hhea.descent)};
  line-gap-override: {pct(hhea.lineGap)};
}}""")
print("\n".join(css))
