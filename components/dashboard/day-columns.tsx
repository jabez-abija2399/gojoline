/**
 * Fourteen days in one short row: a bar per day with its number on top and the day of the month
 * below. Screen readers get the full date and number for each day.
 */
export function DayColumns({ days, label, dayLabel, fullDay, format }: { days: { day: string; value: number }[]; label: string; dayLabel: (day: string) => string; fullDay: (day: string) => string; format: (n: number) => string }) {
  const top = Math.max(1, ...days.map((d) => d.value));
  return (
    <ol aria-label={label} className="grid grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1">
      {days.map((d) => (
        <li key={d.day} className="flex min-w-0 flex-col items-center gap-1">
          <span className="sr-only">{`${fullDay(d.day)}: ${format(d.value)}`}</span>
          <span aria-hidden="true" className="text-[11px] font-semibold tabular-nums leading-none text-ink">{d.value > 0 ? format(d.value) : ""}</span>
          <span aria-hidden="true" className="flex h-16 w-full items-end">
            <span className={`block w-full rounded-t ${d.value > 0 ? "bg-ink" : "bg-sunken"}`} style={{ height: d.value > 0 ? `${Math.max(8, (d.value / top) * 100)}%` : "3px" }} />
          </span>
          <span aria-hidden="true" className="text-[11px] tabular-nums leading-none text-ink-muted">{dayLabel(d.day)}</span>
        </li>
      ))}
    </ol>
  );
}
