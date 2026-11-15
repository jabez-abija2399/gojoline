export default function Loading() {
  return (
    <main id="main" aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div aria-hidden="true" className="h-10 w-2/3 animate-pulse rounded-lg bg-line" />
      <div aria-hidden="true" className="h-32 animate-pulse rounded-xl bg-line" />
      <div aria-hidden="true" className="h-64 animate-pulse rounded-xl bg-line" />
    </main>
  );
}
