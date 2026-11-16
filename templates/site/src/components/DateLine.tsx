import { useEffect, useState } from "react";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";

const CALENDAR = { gregorian: "gregory", ethiopian: "ethiopic", hijri: "islamic-umalqura" } as const;

/** Today's date in Addis Ababa in the chosen calendars ("Today · 16 November 2026 · 7 Hidar 2019 · 25 Jumada I 1448"). Shown once the page runs in a browser. */
export function DateLine({ calendars }: { calendars: (keyof typeof CALENDAR)[] }) {
  const { lang } = useSite();
  const [line, setLine] = useState<string[]>([]);
  useEffect(() => {
    const now = new Date();
    setLine(
      calendars.flatMap((c) => {
        try {
          return [new Intl.DateTimeFormat(`${lang === "am" ? "am-ET" : "en-GB"}-u-ca-${CALENDAR[c]}`, { timeZone: "Africa/Addis_Ababa", day: "numeric", month: "long", year: "numeric" }).format(now).replace(/\s?(ERA\d|AM|AH|ዓ\/ም|ዓ.ም.)$/u, "")];
        } catch {
          return [];
        }
      }),
    );
  }, [calendars, lang]);
  // The line keeps its place before the date is known, so nothing below it moves.
  if (!line.length) return <p aria-hidden="true" className="date-line invisible">{uiText("today", lang)}</p>;
  return (
    <p className="date-line">
      <span className="font-semibold">{uiText("today", lang)}</span>
      {line.map((d, i) => (
        <span key={i}>{d}</span>
      ))}
    </p>
  );
}
