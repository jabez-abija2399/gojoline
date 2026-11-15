/**
 * Delivers one-time sign-in codes. Real delivery (SMS gateway, email service) needs an account
 * and key from the founder: see docs/ROADMAP.md "Blocked". Until then only the dev sender exists.
 */
export interface OtpSender {
  readonly available: boolean;
  send(input: { channel: "sms" | "email"; to: string; code: string; locale: "en" | "am" }): Promise<void>;
}

/** Development and e2e: keeps the last code per recipient in memory and logs it on the server. */
export class DevOtpSender implements OtpSender {
  readonly available = true;
  // Shared across route bundles in one server process (server actions and route handlers
  // can load separate module instances).
  private get codes(): Map<string, string> {
    const g = globalThis as unknown as { gojoDevOtp?: Map<string, string> };
    g.gojoDevOtp ??= new Map();
    return g.gojoDevOtp;
  }
  async send({ channel, to, code }: { channel: "sms" | "email"; to: string; code: string }) {
    this.codes.set(to, code);
    console.info(`[dev otp] ${channel} ${to.replace(/.(?=.{4})/g, "*")}: ${code}`);
  }
  lastCode(to: string): string | undefined {
    return this.codes.get(to);
  }
}

/** Production without a delivery provider: sign-in is closed and the page says so. */
export class UnavailableOtpSender implements OtpSender {
  readonly available = false;
  async send(): Promise<void> {
    throw new Error("No OTP delivery provider configured");
  }
}
