/** The shell's outline while a signed-in page loads, so the menu doesn't vanish and come back. */
export function ShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <div aria-hidden="true" className="flex h-14 items-center gap-3 border-b border-line bg-paper px-3 lg:hidden">
        <span className="skeleton size-8 rounded-lg" />
        <span className="skeleton h-6 w-28 rounded-full" />
        <span className="skeleton ms-auto h-9 w-20 rounded-full" />
      </div>
      <div aria-hidden="true" className="hidden h-dvh w-64 shrink-0 flex-col gap-3 border-e border-line bg-sunken p-3 lg:flex">
        <span className="skeleton h-8 w-32 rounded-lg" />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="skeleton h-9 rounded-xl" />
        ))}
        <span className="skeleton mt-auto h-40 rounded-2xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
