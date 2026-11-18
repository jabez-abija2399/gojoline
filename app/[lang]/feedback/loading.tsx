import { ShellSkeleton } from "@/components/app/shell-skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <main id="main" aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
        <div aria-hidden="true" className="skeleton h-96 rounded-2xl" />
        <div aria-hidden="true" className="skeleton h-8 w-40 rounded-lg" />
        <div aria-hidden="true" className="skeleton h-32 rounded-2xl" />
      </main>
    </ShellSkeleton>
  );
}
