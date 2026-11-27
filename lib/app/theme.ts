import "server-only";
import { cookies } from "next/headers";
import { readCookie } from "@/lib/security/cookies";
import { isTheme, type Theme } from "./theme-shared";

/** The owner's chosen look for the signed-in area; "system" follows the device. */
export async function readTheme(): Promise<Theme> {
  const jar = await cookies();
  const v = readCookie((n) => jar.get(n)?.value, "theme");
  return isTheme(v) ? v : "system";
}
