import "server-only";
import type { Locale } from "./config";
import { en, type Messages } from "./messages/en";
import { am } from "./messages/am";

const catalogs: Record<Locale, Messages> = { en, am };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export type { Messages };
export { format } from "./format";
