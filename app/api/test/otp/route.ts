import { NextResponse } from "next/server";
import { testRoutesOpen } from "@/lib/server/test-routes";
import { otpSender } from "@/lib/auth/server";
import { DevOtpSender } from "@/lib/providers/notify/otp";

/** e2e only: lets Playwright read the code the dev sender "sent". 404 everywhere else. */
export async function GET(request: Request) {
  if (!testRoutesOpen(process.env, { allowDatabase: true }) || !otpSender.available) {
    return new NextResponse(null, { status: 404 });
  }
  const to = new URL(request.url).searchParams.get("to") ?? "";
  return NextResponse.json({ code: new DevOtpSender().lastCode(to) ?? null });
}
