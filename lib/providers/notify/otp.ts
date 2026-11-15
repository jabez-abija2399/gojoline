import { simpleEmail, type EmailSender } from "./email";

/**
 * Delivers one-time sign-in codes. Email goes through Resend; SMS needs a gateway for Ethiopian
 * numbers (docs/ROADMAP.md "Blocked"), so production supports email only until then.
 */
export interface OtpSender {
  readonly available: boolean;
  /** Whether codes can be sent this way (phone sign-in is closed until an SMS gateway exists). */
  supports(channel: "sms" | "email"): boolean;
  send(input: { channel: "sms" | "email"; to: string; code: string; locale: "en" | "am" }): Promise<void>;
}

/** Sign-in codes by email (both languages in one message: we don't know the reader's yet). */
export class EmailOtpSender implements OtpSender {
  readonly available = true;
  constructor(private readonly email: EmailSender) {}
  supports(channel: "sms" | "email") {
    return channel === "email";
  }
  async send({ channel, to, code }: { channel: "sms" | "email"; to: string; code: string; locale?: "en" | "am" }) {
    if (channel !== "email") throw new Error("SMS sign-in is not available");
    const body = simpleEmail({
      en: ["Your Gojoline sign-in code:"],
      code,
      am: [`የጎጆላይን መግቢያ ኮድዎ፦ ${code}`, "ኮዱ ለ10 ደቂቃ ያገለግላል። ይህን ያልጠየቁ ከሆነ ይህን ኢሜይል ይተዉት።"],
    });
    await this.email.send({
      to,
      subject: `${code} is your Gojoline code · የጎጆላይን ኮድዎ`,
      text: `${body.text}\n\nThe code works for 10 minutes. If you didn't ask for it, ignore this email.`,
      html: body.html,
    });
  }
}

/** Development and e2e: keeps the last code per recipient in memory and logs it on the server. */
export class DevOtpSender implements OtpSender {
  readonly available = true;
  supports() {
    return true;
  }
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
  supports() {
    return false;
  }
  async send(): Promise<void> {
    throw new Error("No OTP delivery provider configured");
  }
}
