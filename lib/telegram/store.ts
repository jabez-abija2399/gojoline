import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { telegramLinkCodes, telegramLinks, telegramUpdates } from "@/lib/db/schema";

export interface TelegramLink {
  userId: string;
  chatId: string;
  username: string | null;
  locale: "en" | "am";
  activeProjectId: string | null;
  /** A bigger edit waiting for the owner's "yes" (null when nothing waits). */
  pendingEdit?: PendingEdit | null;
}

export interface PendingEdit {
  projectId: string;
  text: string;
  size: "medium" | "large";
  /** The changes the owner was told it uses. */
  cost: number;
  /** ISO time it was asked; a "yes" after PENDING_TTL_MS is ignored. */
  at: string;
}

export interface TelegramStore {
  /** One-time code for the deep link, valid 15 minutes. */
  createLinkCode(userId: string, locale: "en" | "am"): Promise<string>;
  consumeLinkCode(code: string): Promise<{ userId: string; locale: "en" | "am" } | null>;
  link(input: Omit<TelegramLink, "activeProjectId">): Promise<void>;
  unlink(userId: string): Promise<void>;
  byUser(userId: string): Promise<TelegramLink | null>;
  byChat(chatId: string): Promise<TelegramLink | null>;
  setActiveProject(userId: string, projectId: string | null): Promise<void>;
  setPendingEdit(userId: string, pending: PendingEdit | null): Promise<void>;
  /** True the first time an update id is seen. */
  firstSeen(updateId: number): Promise<boolean>;
}

const hash = (code: string) => createHash("sha256").update(code).digest("hex");
export const newCode = () => randomBytes(18).toString("base64url");
const CODE_TTL_MS = 15 * 60_000;

export class MemoryTelegramStore implements TelegramStore {
  private codes = new Map<string, { userId: string; locale: "en" | "am"; expiresAt: number; used: boolean }>();
  private links = new Map<string, TelegramLink>();
  private updates = new Set<number>();
  async createLinkCode(userId: string, locale: "en" | "am") {
    const code = newCode();
    this.codes.set(hash(code), { userId, locale, expiresAt: Date.now() + CODE_TTL_MS, used: false });
    return code;
  }
  async consumeLinkCode(code: string) {
    const c = this.codes.get(hash(code));
    if (!c || c.used || c.expiresAt < Date.now()) return null;
    c.used = true;
    return { userId: c.userId, locale: c.locale };
  }
  async link(input: Omit<TelegramLink, "activeProjectId">) {
    for (const [u, l] of this.links) if (l.chatId === input.chatId) this.links.delete(u);
    this.links.set(input.userId, { ...input, activeProjectId: null, pendingEdit: null });
  }
  async unlink(userId: string) {
    this.links.delete(userId);
  }
  async byUser(userId: string) {
    return this.links.get(userId) ?? null;
  }
  async byChat(chatId: string) {
    return [...this.links.values()].find((l) => l.chatId === chatId) ?? null;
  }
  async setActiveProject(userId: string, projectId: string | null) {
    const l = this.links.get(userId);
    if (l) Object.assign(l, { activeProjectId: projectId, pendingEdit: null });
  }
  async setPendingEdit(userId: string, pending: PendingEdit | null) {
    const l = this.links.get(userId);
    if (l) l.pendingEdit = pending;
  }
  async firstSeen(updateId: number) {
    if (this.updates.has(updateId)) return false;
    this.updates.add(updateId);
    return true;
  }
}

export class DbTelegramStore implements TelegramStore {
  constructor(private db: Database) {}
  async createLinkCode(userId: string, locale: "en" | "am") {
    const code = newCode();
    await this.db.insert(telegramLinkCodes).values({ codeHash: hash(code), userId, locale, expiresAt: new Date(Date.now() + CODE_TTL_MS) });
    return code;
  }
  async consumeLinkCode(code: string) {
    // Single UPDATE ... RETURNING: a code can only be used once, even with retries.
    const [row] = await this.db
      .update(telegramLinkCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(telegramLinkCodes.codeHash, hash(code)), isNull(telegramLinkCodes.usedAt), gt(telegramLinkCodes.expiresAt, new Date())))
      .returning({ userId: telegramLinkCodes.userId, locale: telegramLinkCodes.locale });
    return row ?? null;
  }
  async link(input: Omit<TelegramLink, "activeProjectId">) {
    // A chat belongs to one account: move it if it was linked elsewhere.
    await this.db.delete(telegramLinks).where(eq(telegramLinks.chatId, input.chatId));
    await this.db
      .insert(telegramLinks)
      .values({ ...input, activeProjectId: null })
      .onConflictDoUpdate({ target: telegramLinks.userId, set: { chatId: input.chatId, username: input.username, locale: input.locale, activeProjectId: null, pendingEdit: null } });
  }
  async unlink(userId: string) {
    await this.db.delete(telegramLinks).where(eq(telegramLinks.userId, userId));
  }
  async byUser(userId: string) {
    const [row] = await this.db.select().from(telegramLinks).where(eq(telegramLinks.userId, userId)).limit(1);
    return row ?? null;
  }
  async byChat(chatId: string) {
    const [row] = await this.db.select().from(telegramLinks).where(eq(telegramLinks.chatId, chatId)).limit(1);
    return row ?? null;
  }
  async setActiveProject(userId: string, projectId: string | null) {
    await this.db.update(telegramLinks).set({ activeProjectId: projectId, pendingEdit: null }).where(eq(telegramLinks.userId, userId));
  }
  async setPendingEdit(userId: string, pending: PendingEdit | null) {
    await this.db.update(telegramLinks).set({ pendingEdit: pending }).where(eq(telegramLinks.userId, userId));
  }
  async firstSeen(updateId: number) {
    const rows = await this.db.insert(telegramUpdates).values({ updateId }).onConflictDoNothing().returning({ id: telegramUpdates.updateId });
    return rows.length === 1;
  }
}
