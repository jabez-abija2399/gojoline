import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, isTheme, type Theme } from "./theme-shared";

/** The owner's chosen look for the signed-in area; "system" follows the device. */
export async function readTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(v) ? v : "system";
}
