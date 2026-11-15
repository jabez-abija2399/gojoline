/** Sends transactional email (sign-in codes, payment notices). Resend in production. */
export interface EmailSender {
  send(input: { to: string; subject: string; text: string; html: string }): Promise<void>;
}

/** Resend's HTTP API. The sending domain (afridea.et for now) must be verified in Resend. */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(input: { to: string; subject: string; text: string; html: string }) {
    const res = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Resend's error names the problem (e.g. unverified domain); it never echoes the key.
      const detail = await res.text().catch(() => "");
      throw new Error(`resend ${res.status}: ${detail.slice(0, 200)}`);
    }
  }
}

/** Tests and e2e: keeps sent mail in memory. */
export class MemoryEmailSender implements EmailSender {
  readonly sent: { to: string; subject: string; text: string; html: string }[] = [];
  async send(input: { to: string; subject: string; text: string; html: string }) {
    this.sent.push(input);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A short, plain, bilingual email: brand colours, no images, no tracking. */
export function simpleEmail(parts: { en: string[]; am: string[]; code?: string }): { text: string; html: string } {
  const text = [...parts.en, ...(parts.code ? [parts.code] : []), "", ...parts.am].join("\n");
  const p = (s: string, lang: string) => `<p lang="${lang}" style="margin:0 0 12px">${esc(s)}</p>`;
  const code = parts.code
    ? `<p style="margin:16px 0;font-size:32px;font-weight:700;letter-spacing:6px;color:#121212">${esc(parts.code)}</p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#FBF9F6;padding:24px;font-family:system-ui,'Noto Sans Ethiopic',sans-serif;color:#121212;font-size:16px;line-height:1.5"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px"><p style="margin:0 0 16px;font-weight:700;font-size:20px;color:#121212">Gojoline · ጎጆላይን</p>${parts.en.map((s) => p(s, "en")).join("")}${code}<hr style="border:none;border-top:1px solid #E9E4DC;margin:20px 0">${parts.am.map((s) => p(s, "am")).join("")}</div></body></html>`;
  return { text, html };
}
