import { NextResponse } from "next/server";
import { otpSender } from "@/lib/auth/server";
import { DevOtpSender } from "@/lib/providers/notify/otp";

/** e2e only: lets Playwright read the code the dev sender "sent". 404 everywhere else. */
export async function GET(request: Request) {
  if (process.env.E2E !== "1" || process.env.VERCEL === "1" || !otpSender.available) {
    return new NextResponse(null, { status: 404 });
  }
  const to = new URL(request.url).searchParams.get("to") ?? "";
  return NextResponse.json({ code: new DevOtpSender().lastCode(to) ?? null });
}
