/** The few Telegram Bot API calls we use. Behind an interface so tests never call Telegram. */
export interface TelegramClient {
  sendMessage(chatId: string, html: string): Promise<void>;
  /** Downloads a file the user sent (photos); null if missing or too large. */
  downloadFile(fileId: string, maxBytes: number): Promise<Buffer | null>;
  /**
   * Posts to a chat or channel (our own posts): text, or a photo/video with a caption. Returns the
   * message id, or throws with Telegram's reason.
   */
  post(chatId: string, input: { html: string; media?: { kind: "photo" | "video"; data: Buffer; name: string } | null }): Promise<string>;
}

export class BotApiClient implements TelegramClient {
  constructor(
    private token: string,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(method: string, body: unknown): Promise<T | null> {
    const res = await this.fetchImpl(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
    // Log the method and Telegram's reason only, never the URL (it contains the token).
    if (!data?.ok) console.warn(`telegram ${method} failed: ${data?.description ?? res.status}`);
    return data?.ok ? (data.result ?? null) : null;
  }

  async sendMessage(chatId: string, html: string) {
    await this.call("sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
  }

  async post(chatId: string, input: { html: string; media?: { kind: "photo" | "video"; data: Buffer; name: string } | null }) {
    const send = async (method: string, body: FormData | object) => {
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.token}/${method}`, {
        method: "POST",
        ...(body instanceof FormData ? { body } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(120_000),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; result?: { message_id?: number }; description?: string } | null;
      // Telegram's reason only, never the URL (it contains the token).
      if (!data?.ok) throw new Error(`telegram ${method}: ${data?.description ?? res.status}`);
      return String(data.result?.message_id ?? "");
    };
    const m = input.media;
    // A caption under a photo or video may be 1024 characters; longer text follows as its own message.
    if (m && input.html.length <= 1024) {
      const form = new FormData();
      form.set("chat_id", chatId);
      form.set("caption", input.html);
      form.set("parse_mode", "HTML");
      form.set(m.kind, new Blob([new Uint8Array(m.data)]), m.name);
      return send(m.kind === "photo" ? "sendPhoto" : "sendVideo", form);
    }
    if (m) {
      const form = new FormData();
      form.set("chat_id", chatId);
      form.set(m.kind, new Blob([new Uint8Array(m.data)]), m.name);
      await send(m.kind === "photo" ? "sendPhoto" : "sendVideo", form);
    }
    return send("sendMessage", { chat_id: chatId, text: input.html, parse_mode: "HTML" });
  }

  async downloadFile(fileId: string, maxBytes: number) {
    const file = await this.call<{ file_path?: string; file_size?: number }>("getFile", { file_id: fileId });
    if (!file?.file_path || (file.file_size ?? 0) > maxBytes || !/^[\w/.-]+$/.test(file.file_path)) return null;
    const res = await this.fetchImpl(`https://api.telegram.org/file/bot${this.token}/${file.file_path}`, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > maxBytes ? null : buf;
  }
}

export class MemoryTelegramClient implements TelegramClient {
  readonly sent: { chatId: string; html: string }[] = [];
  readonly files = new Map<string, Buffer>();
  readonly posts: { chatId: string; html: string; media: { kind: string; name: string; bytes: number } | null }[] = [];
  async post(chatId: string, input: { html: string; media?: { kind: "photo" | "video"; data: Buffer; name: string } | null }) {
    this.posts.push({ chatId, html: input.html, media: input.media ? { kind: input.media.kind, name: input.media.name, bytes: input.media.data.length } : null });
    return String(this.posts.length);
  }
  async sendMessage(chatId: string, html: string) {
    this.sent.push({ chatId, html });
  }
  async downloadFile(fileId: string) {
    return this.files.get(fileId) ?? null;
  }
}

/** Escapes text for Telegram's HTML parse mode. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
