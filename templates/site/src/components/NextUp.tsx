import { useEffect, useState } from "react";

/** Minutes since midnight in Addis Ababa now (sites list their times in local time). */
function addisMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Addis_Ababa", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return (get("hour") % 24) * 60 + get("minute");
}

/**
 * Which of a list of "HH:MM" times comes next, and in how many minutes; null until the page
 * runs in a browser (the page is written without a highlight). Updates every minute.
 */
export function useNextTime(times: (string | undefined)[]): { index: number; inMinutes: number } | null {
  const [next, setNext] = useState<{ index: number; inMinutes: number } | null>(null);
  const key = times.join(",");
  useEffect(() => {
    const mins = times.map((t) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null));
    if (mins.every((m) => m === null)) return;
    const update = () => {
      const now = addisMinutes();
      let best: { index: number; inMinutes: number } | null = null;
      mins.forEach((m, index) => {
        if (m === null) return;
        const inMinutes = (m - now + 1440) % 1440;
        if (!best || inMinutes < best.inMinutes) best = { index, inMinutes };
      });
      setNext(best);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return next;
}
