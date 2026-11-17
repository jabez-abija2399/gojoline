/**
 * Whether the e2e-only routes under /api/test answer. They need the explicit `E2E=1` flag (also
 * in a production build, which is how Playwright runs the app), never run on Vercel, and, except
 * for reading a sign-in code, never against a real database.
 */
export function testRoutesOpen(env: Record<string, string | undefined> = process.env, opts: { allowDatabase?: boolean } = {}): boolean {
  if (env.E2E !== "1" || env.VERCEL === "1") return false;
  return opts.allowDatabase === true || !env.DATABASE_URL;
}
