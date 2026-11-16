/** Shown while a template's page loads: the same shapes as the page, no text (so no language needed). */
export default function TemplateLoading() {
  const block = "rounded-xl bg-sunken motion-safe:animate-pulse";
  return (
    <main id="main" tabIndex={-1} aria-busy="true" className="flex-1 focus:outline-none">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:py-10">
        <div className={`${block} h-5 w-56`} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-1">
            <div className={`${block} h-10 w-3/4`} />
            <div className={`${block} h-5 w-1/2`} />
            <div className={`${block} h-14 w-full`} />
            <div className={`${block} h-5 w-2/3`} />
            <div className={`${block} mt-3 h-12 w-full rounded-full max-lg:hidden`} />
          </div>
          <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
            <div className="flex gap-2">
              <div className={`${block} h-11 w-20 rounded-full`} />
              <div className={`${block} h-11 w-20 rounded-full`} />
              <div className={`${block} h-11 w-20 rounded-full`} />
            </div>
            <div className={`${block} mx-auto aspect-[9/16] w-full max-w-[390px] lg:aspect-[16/10] lg:max-w-none`} />
          </div>
        </div>
      </div>
    </main>
  );
}
