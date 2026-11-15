"""Generate Gojoline brand SVG assets (logo mark, lockups, icons) from one source."""
import os
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]
FONTS = sys.argv[2]

CLAY = "#FF5B35"  # coral
CLAY_LIGHT = "#FF7350"  # coral on dark
TEAL = "#121212"  # ink: the door and dark backgrounds
INK = "#121212"
SAND = "#FBF9F6"  # paper
WHITE = "#FFFFFF"

# ---------- the mark, drawn on a 120 x 120 grid ----------
ROOF = "M14 70 L60 34 L106 70 Z"
WALL = "M28 68 V94 Q60 106 92 94 V68 Z"
DOOR = "M53 100.5 V84 A7 7 0 0 1 67 84 V100.5 Z"
FINIAL = "M60 35 V25"
LINES = "M12.7 30 H107.3 M25.4 16 H94.6"


def mark_group(disc=CLAY, gojo=SAND, door=TEAL, lines=SAND, uid="m", detail=True):
    """Full-colour mark: coral globe, gojo cut in paper, ink door, faint world lines in the sky."""
    world = ""
    if detail:
        world = (
            f'<clipPath id="{uid}-sky"><path d="M4 60 A56 56 0 0 1 116 60 V70 H4 Z"/></clipPath>'
            f'<g clip-path="url(#{uid}-sky)" fill="none" stroke="{lines}" stroke-opacity="0.5" stroke-width="2.6">'
            f'<ellipse cx="60" cy="60" rx="24" ry="54"/><path d="{LINES}"/></g>'
        )
    finial = ""
    if detail:
        finial = (
            f'<path d="{FINIAL}" stroke="{gojo}" stroke-width="4" stroke-linecap="round" fill="none"/>'
            f'<circle cx="60" cy="22.5" r="3.4" fill="{gojo}"/>'
        )
    return (
        f'<circle cx="60" cy="60" r="56" fill="{disc}"/>{world}'
        f'<path d="{ROOF}" fill="{gojo}" stroke="{gojo}" stroke-width="4" stroke-linejoin="round"/>'
        f'<path d="{WALL}" fill="{gojo}"/>{finial}'
        f'<path d="{DOOR}" fill="{door}"/>'
    )


def mono_group(color, uid="mono", detail=True):
    """One-colour mark: the gojo is a true transparent cut-out (works on any background)."""
    world = ""
    if detail:
        world = (
            f'<g clip-path="url(#{uid}-sky)" fill="none" stroke="black" stroke-opacity="0.55" stroke-width="2.6">'
            f'<ellipse cx="60" cy="60" rx="24" ry="54"/><path d="{LINES}"/></g>'
            f'<path d="{FINIAL}" stroke="black" stroke-width="4" stroke-linecap="round" fill="none"/>'
            f'<circle cx="60" cy="22.5" r="3.4" fill="black"/>'
        )
    return (
        f'<clipPath id="{uid}-sky"><path d="M4 60 A56 56 0 0 1 116 60 V70 H4 Z"/></clipPath>'
        f'<mask id="{uid}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">'
        f'<rect width="120" height="120" fill="white"/>{world}'
        f'<path d="{ROOF}" fill="black" stroke="black" stroke-width="4" stroke-linejoin="round"/>'
        f'<path d="{WALL}" fill="black"/><path d="{DOOR}" fill="white"/></mask>'
        f'<circle cx="60" cy="60" r="56" fill="{color}" mask="url(#{uid}-cut)"/>'
    )


def svg(w, h, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}" '
        f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'
    )


# ---------- text to outlines ----------
class Face:
    def __init__(self, path):
        self.font = TTFont(path)
        self.gs = self.font.getGlyphSet()
        self.cmap = self.font.getBestCmap()
        self.upm = self.font["head"].unitsPerEm
        self.hmtx = self.font["hmtx"]

    def run(self, text, size, x, baseline, tracking=0.0):
        """Return (svg path d, end x) for text set at `size`, starting at x on `baseline`."""
        s = size / self.upm
        parts = []
        for ch in text:
            g = self.cmap[ord(ch)]
            pen = SVGPathPen(self.gs)
            self.gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
            parts.append(pen.getCommands())
            x += self.hmtx[g][0] * s + tracking * size
        return " ".join(parts), x - tracking * size


outfit = Face(os.path.join(FONTS, "outfit/package/files/outfit-latin-700-normal.woff2"))
ethi = Face(os.path.join(FONTS, "noto-sans-ethiopic/package/files/noto-sans-ethiopic-ethiopic-700-normal.woff2"))


def wordmark(x, baseline, size, gojo_color, line_color):
    d1, x1 = outfit.run("gojo", size, x, baseline, -0.02)
    d2, x2 = outfit.run("line", size, x1 - 0.02 * size, baseline, -0.02)
    return f'<path d="{d1}" fill="{gojo_color}"/><path d="{d2}" fill="{line_color}"/>', x2


def wordmark_am(x, baseline, size, gojo_color, line_color):
    d1, x1 = ethi.run("ጎጆ", size, x, baseline)
    d2, x2 = ethi.run("ላይን", size, x1, baseline)
    return f'<path d="{d1}" fill="{gojo_color}"/><path d="{d2}" fill="{line_color}"/>', x2


def place(group, x, y, size):
    return f'<g transform="translate({x:g} {y:g}) scale({size / 120:g})">{group}</g>'


files = {}

# Marks
files["logo/gojoline-mark.svg"] = svg(120, 120, mark_group(uid="a"), "Gojoline")
files["logo/gojoline-mark-teal.svg"] = svg(120, 120, mark_group(disc=TEAL, door=CLAY, uid="b"), "Gojoline")
files["logo/gojoline-mark-black.svg"] = svg(120, 120, mono_group(INK, uid="c"), "Gojoline")
files["logo/gojoline-mark-white.svg"] = svg(120, 120, mono_group(WHITE, uid="d"), "Gojoline")
files["logo/gojoline-mark-simple.svg"] = svg(120, 120, mark_group(uid="e", detail=False), "Gojoline")

# Horizontal lockups (mark 120 tall, wordmark beside it)
MARK, GAP, SIZE, BASE = 120, 30, 104, 82


def horizontal(gojo_c, line_c, mark_svg, am=False, pad=8):
    x0 = pad + MARK + GAP
    if am:
        body, x_end = wordmark_am(x0, 92, 84, gojo_c, line_c)
    else:
        body, x_end = wordmark(x0, BASE, SIZE, gojo_c, line_c)
    w = x_end + pad
    return svg(w, MARK + 2 * pad, place(mark_svg, pad, pad, MARK) + body.replace("<path", "<path", 1), "Gojoline")


files["logo/gojoline-logo.svg"] = horizontal(INK, CLAY, mark_group(uid="f"))
files["logo/gojoline-logo-reversed.svg"] = horizontal(WHITE, CLAY_LIGHT, mark_group(uid="g"))
files["logo/gojoline-logo-amharic.svg"] = horizontal(TEAL, CLAY, mark_group(uid="h"), am=True)
files["logo/gojoline-logo-amharic-reversed.svg"] = horizontal(WHITE, CLAY_LIGHT, mark_group(uid="i"), am=True)
files["logo/gojoline-logo-black.svg"] = horizontal(INK, INK, mono_group(INK, uid="j"))
files["logo/gojoline-logo-white.svg"] = horizontal(WHITE, WHITE, mono_group(WHITE, uid="k"))

# Wordmark only
wm_body, wm_end = wordmark(4, BASE, SIZE, INK, CLAY)
files["logo/gojoline-wordmark.svg"] = svg(wm_end + 4, 110, wm_body, "Gojoline")

# Stacked lockup
st_mark = 160
wm_tmp, wm_w = wordmark(0, 0, SIZE, INK, CLAY)
st_w = max(wm_w, st_mark) + 16
st_body = place(mark_group(uid="l"), (st_w - st_mark) / 2, 8, st_mark)
wm_s, _ = wordmark((st_w - wm_w) / 2, 8 + st_mark + 24 + 76, SIZE, INK, CLAY)
files["logo/gojoline-logo-stacked.svg"] = svg(st_w, 8 + st_mark + 24 + 76 + 32, st_body + wm_s, "Gojoline")

# App icons
files["icons/app-icon.svg"] = svg(1024, 1024, f'<rect width="1024" height="1024" fill="{TEAL}"/>' + place(mark_group(uid="n"), 112, 112, 800), "Gojoline app icon")
files["icons/app-icon-light.svg"] = svg(1024, 1024, f'<rect width="1024" height="1024" fill="{SAND}"/>' + place(mark_group(uid="o"), 112, 112, 800), "Gojoline app icon")
files["icons/maskable-icon.svg"] = svg(1024, 1024, f'<rect width="1024" height="1024" fill="{TEAL}"/>' + place(mark_group(uid="p"), 232, 232, 560), "Gojoline app icon")
files["icons/favicon.svg"] = svg(120, 120, mark_group(uid="q", detail=False), "Gojoline")
files["icons/telegram-avatar.svg"] = svg(640, 640, f'<rect width="640" height="640" fill="{TEAL}"/>' + place(mark_group(uid="r"), 80, 80, 480), "Gojoline")

for rel, content in files.items():
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(rel, len(content))
