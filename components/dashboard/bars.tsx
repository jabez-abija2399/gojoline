/**
 * Horizontal bars with the number written beside each one: easy to read on a phone, no hover
 * needed, and a real list for screen readers. Colour stays neutral (ink); nothing here needs attention.
 */
export function Bars({ rows, label, max }: { rows: { key: string; label: string; value: number; text: string }[]; label: string; max?: number }) {
  const top = Math.max(1, max ?? Math.max(...rows.map((r) => r.value)));
  return (
    <ul aria-label={label} className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="col-span-3 grid grid-cols-subgrid items-center text-sm">
          <span className="max-w-[9rem] text-ink-muted sm:max-w-none">{r.label}</span>
          <span aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-sunken">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${(r.value / top) * 100}%` }} />
          </span>
          <span className="min-w-8 text-end font-semibold tabular-nums">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}
