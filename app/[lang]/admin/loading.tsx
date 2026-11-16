import { cookies } from "next/headers";

/** Admin outline while a tab loads: sidebar, title, filter chips, a panel and table rows. */
export default async function Loading() {
  const saved = (await cookies()).get("gojo_admin_theme")?.value;
  const theme = (["light", "dark", "system"] as const).find((x) => x === saved) ?? "system";
  const bar = (cls: string) => <div aria-hidden="true" className={`skeleton rounded-lg ${cls}`} />;
  return (
    <div data-gojo-theme={theme} className="admin-root flex min-h-screen flex-1 bg-paper text-ink">
      <aside aria-hidden="true" className="hidden w-64 shrink-0 flex-col gap-3 border-e border-line bg-white p-4 lg:flex">
        {bar("h-8 w-40")}
        {Array.from({ length: 7 }, (_, i) => <div key={i}>{bar("h-11 w-full")}</div>)}
      </aside>
      <main id="main" aria-busy="true" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        {bar("h-9 w-48")}
        <div className="flex flex-wrap gap-2">{Array.from({ length: 4 }, (_, i) => <div key={i}>{bar("h-11 w-24 rounded-full")}</div>)}</div>
        {bar("h-11 w-full")}
        {bar("h-48 w-full rounded-2xl")}
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
          {Array.from({ length: 6 }, (_, i) => <div key={i}>{bar("h-10 w-full")}</div>)}
        </div>
      </main>
    </div>
  );
}
