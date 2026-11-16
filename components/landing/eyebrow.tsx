/** The small label above a section's heading, as the reference marks its sections. */
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`reveal inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${dark ? "border-white/20 text-sunken" : "border-line bg-white text-ink-muted"}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-coral" />
      {children}
    </span>
  );
}
