/** The few Telegram Bot API calls we use. Behind an interface so tests never call Telegram. */
export interface TelegramClient {
  sendMessage(chatId: string, html: string): Promise<void>;
  /** Downloads a file the user sent (photos); null if missing or too large. */
  downloadFile(fileId: string, maxBytes: number): Promise<Buffer | null>;
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
