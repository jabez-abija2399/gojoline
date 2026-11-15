/**
 * A scatter of small squares, denser toward the top and the sides: woven cloth seen close,
 * or pixels. Decoration behind product pictures. The pattern is fixed (no randomness at
 * render), so server and browser draw the same thing.
 */
function scatter(cols: number, rows: number) {
  const cells: { x: number; y: number; o: number }[] = [];
  let seed = 7 + cols * 31 + rows;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const edge = Math.min(x, cols - 1 - x) / (cols / 2); // 0 at the sides, 1 in the middle
      const depth = y / rows; // 0 at the top
      const chance = 0.62 * (1 - depth) * (1 - edge * 0.75) + 0.05;
      const r = rand();
      const o = rand();
      if (r < chance) cells.push({ x, y, o: 0.25 + o * 0.75 });
    }
  }
  return cells;
}

const CELL = 28;

export function Mosaic({ cols = 60, rows = 14, className = "fill-sun" }: { cols?: number; rows?: number; className?: string }) {
  // One path per shade (four shades) instead of one element per square: the same picture in
  // a fraction of the markup.
  const shades = [0.35, 0.55, 0.75, 1];
  const paths = shades.map(() => "");
  for (const c of scatter(cols, rows)) {
    const i = Math.min(shades.length - 1, Math.floor(((c.o - 0.25) / 0.75) * shades.length));
    paths[i] += `M${c.x} ${c.y}h1v1h-1z`;
  }
  // Drawn at a fixed size and centred, never stretched: the squares stay square at every width
  // and the parent simply crops what doesn't fit.
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols * CELL}
      height={rows * CELL}
      className={`pointer-events-none absolute top-0 left-1/2 max-w-none -translate-x-1/2 ${className}`}
    >
      {paths.map((d, i) => d && <path key={i} d={d} opacity={shades[i]} />)}
    </svg>
  );
}
