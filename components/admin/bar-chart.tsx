import type { DayPoint } from "@/lib/admin/stats";

/**
 * One measure over a run of days, weeks or months: thin bars with rounded tops, a 2 px gap, a quiet grid,
 * a hover label on every bar (and a hit area taller than the bar), and a table for screen readers.
 */
export function BarChart({ title, data, format, tableLabel, dayLabel, valueLabel, emptyLabel, formatDay, heading = false, totalText, compact = false }: { title: string; data: DayPoint[]; format: (v: number) => string; tableLabel: string; dayLabel: string; valueLabel: string; emptyLabel: string; /** Words for a YYYY-MM-DD day (default MM/DD). */ formatDay?: (day: string) => string; /** Make the title a heading (h2) where the page's other cards have headings. */ heading?: boolean; /** Words around the total, e.g. "Total {value}" (default: the number alone). */ totalText?: (value: string) => string; /** Shorter on phones. */ compact?: boolean }) {
  const W = 600;
  const H = 140;
  const top = 8;
  const bottom = 1;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = W / data.length;
  const bw = Math.max(2, step - 2);
  const y = (v: number) => H - bottom - ((H - top - bottom) * v) / max;
  const total = data.reduce((n, d) => n + d.value, 0);
  const shortDay = formatDay ?? ((d: string) => d.slice(5).replace("-", "/"));
  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        {heading ? <h2 className="text-base font-semibold">{title}</h2> : <span className="font-semibold">{title}</span>}
        <span className="font-display text-lg font-bold tabular-nums">{totalText ? totalText(format(total)) : format(total)}</span>
      </figcaption>
      <div className="relative">
      {total === 0 && <p className="absolute inset-0 flex items-center justify-center text-ink-muted">{emptyLabel}</p>}
      {/* The scale: the top line's value (text outside the stretched svg, so it stays readable). */}
      {total > 0 && <span aria-hidden="true" className="absolute end-0 -top-1 rounded bg-white px-1 text-xs text-ink-muted tabular-nums">{format(max)}</span>}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${title}: ${totalText ? totalText(format(total)) : format(total)}`} className={`${compact ? "h-24 sm:h-36" : "h-36"} w-full`}>
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} className="stroke-line" strokeWidth={1} strokeDasharray="2 4" />
        ))}
        <line x1={0} x2={W} y1={H - bottom} y2={H - bottom} className="stroke-line" strokeWidth={1} />
        {data.map((d, i) => {
          const x = i * step + 1;
          const yy = y(d.value);
          const h = H - bottom - yy;
          const r = Math.min(4, h / 2, bw / 2);
          return (
            <g key={d.day} className="group">
              <title>{`${shortDay(d.day)}: ${format(d.value)}`}</title>
              <rect x={i * step} y={top} width={step} height={H - top - bottom} className="fill-transparent group-hover:fill-sunken/40" />
              {d.value > 0 && (
                <path
                  d={`M${x},${H - bottom} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${H - bottom} Z`}
                  className="fill-ink group-hover:fill-faint"
                />
              )}
            </g>
          );
        })}
      </svg>
      </div>
      <div className="flex justify-between text-xs text-ink-muted tabular-nums" aria-hidden="true">
        <span>{shortDay(data[0]!.day)}</span>
        <span>{shortDay(data.at(-1)!.day)}</span>
      </div>
      <details className="text-xs">
        <summary className="inline-flex min-h-11 pointer-fine:min-h-9 cursor-pointer items-center text-ink-muted">{tableLabel}</summary>
        <table className="w-full">
          <thead>
            <tr className="text-ink-muted">
              <th scope="col" className="text-start font-medium">{dayLabel}</th>
              <th scope="col" className="text-end font-medium">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.filter((d) => d.value > 0).map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="py-1">{formatDay ? formatDay(d.day) : d.day}</td>
                <td className="py-1 text-end tabular-nums">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
