import { randomUUID } from "node:crypto";
import { and, count, desc, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { feedback, subscriptions, user } from "@/lib/db/schema";
import { outerUserId } from "@/lib/admin/stats";
import { emptyCounts, type AdminFeedback, type Feedback, type FeedbackFilter, type FeedbackInput, type FeedbackOwner, type FeedbackStatus, type FeedbackStore } from "./types";

type Row = Feedback & { screenshot: Buffer | null };

const strip = ({ screenshot: _s, ...f }: Row): Feedback => (void _s, f);

/** Development and e2e: kept in process memory. `ownerInfo` fills in the admin's view of who sent it. */
export class MemoryFeedbackStore implements FeedbackStore {
  readonly rows: Row[] = [];
  constructor(private ownerInfo: (ownerId: string) => Promise<FeedbackOwner | null> = async () => null) {}

  async add(ownerId: string, input: FeedbackInput, screenshot: Buffer | null) {
    const row: Row = { ...input, id: randomUUID(), ownerId, screenshot, hasScreenshot: !!screenshot, status: "new", reply: null, repliedAt: null, replyReadAt: null, createdAt: new Date() };
    this.rows.push(row);
    return strip(row);
  }
  private newest(rows: Row[]) {
    return [...rows].sort((a, b) => +b.createdAt - +a.createdAt);
  }
  async listForOwner(ownerId: string, limit: number) {
    return this.newest(this.rows.filter((r) => r.ownerId === ownerId)).slice(0, limit).map(strip);
  }
  async unreadReplies(ownerId: string) {
    return this.rows.filter((r) => r.ownerId === ownerId && r.reply && !r.replyReadAt).length;
  }
  async markRepliesRead(ownerId: string) {
    const now = new Date();
    for (const r of this.rows) if (r.ownerId === ownerId && r.reply && !r.replyReadAt) r.replyReadAt = now;
  }
  async screenshot(id: string, ownerId: string | null) {
    const r = this.rows.find((x) => x.id === id && (ownerId === null || x.ownerId === ownerId));
    return r?.screenshot ?? null;
  }
  async get(id: string) {
    const r = this.rows.find((x) => x.id === id);
    return r ? strip(r) : null;
  }
  async adminList(filter: FeedbackFilter, limit: number) {
    const rows = this.newest(this.rows.filter((r) => (!filter.status || r.status === filter.status) && (!filter.type || r.type === filter.type))).slice(0, limit);
    return Promise.all(rows.map(async (r): Promise<AdminFeedback> => ({ ...strip(r), owner: await this.ownerInfo(r.ownerId) })));
  }
  async countByStatus() {
    const c = emptyCounts();
    for (const r of this.rows) c[r.status]++;
    return c;
  }
  async setStatus(id: string, status: FeedbackStatus) {
    const r = this.rows.find((x) => x.id === id);
    if (!r) return null;
    const before = r.status;
    r.status = status;
    return before;
  }
  async reply(id: string, text: string, _adminId?: string) {
    void _adminId;
    const r = this.rows.find((x) => x.id === id);
    if (!r) return false;
    Object.assign(r, { reply: text, repliedAt: new Date(), replyReadAt: null });
    return true;
  }
}

const cols = {
  id: feedback.id,
  ownerId: feedback.ownerId,
  type: feedback.type,
  message: feedback.message,
  rating: feedback.rating,
  page: feedback.page,
  locale: feedback.locale,
  device: feedback.device,
  userAgent: feedback.userAgent,
  hasScreenshot: sql<boolean>`${feedback.screenshot} is not null`,
  status: feedback.status,
  reply: feedback.reply,
  repliedAt: feedback.repliedAt,
  replyReadAt: feedback.replyReadAt,
  createdAt: feedback.createdAt,
};

const phoneOnly = (email: string) => email.endsWith("@phone.gojoline.invalid");

/** Neon Postgres. Owner reads always filter by owner_id; the screenshot column is read only on its own route. */
export class DbFeedbackStore implements FeedbackStore {
  constructor(private db: Database) {}

  async add(ownerId: string, input: FeedbackInput, screenshot: Buffer | null) {
    const [row] = await this.db.insert(feedback).values({ ...input, ownerId, screenshot }).returning(cols);
    return row!;
  }
  async listForOwner(ownerId: string, limit: number) {
    return this.db.select(cols).from(feedback).where(eq(feedback.ownerId, ownerId)).orderBy(desc(feedback.createdAt)).limit(limit);
  }
  async unreadReplies(ownerId: string) {
    const [r] = await this.db.select({ n: count() }).from(feedback).where(and(eq(feedback.ownerId, ownerId), isNotNull(feedback.reply), isNull(feedback.replyReadAt)));
    return Number(r?.n ?? 0);
  }
  async markRepliesRead(ownerId: string) {
    await this.db.update(feedback).set({ replyReadAt: sql`now()` }).where(and(eq(feedback.ownerId, ownerId), isNotNull(feedback.reply), isNull(feedback.replyReadAt)));
  }
  async screenshot(id: string, ownerId: string | null) {
    const [r] = await this.db
      .select({ s: feedback.screenshot })
      .from(feedback)
      .where(and(eq(feedback.id, id), ownerId === null ? undefined : eq(feedback.ownerId, ownerId)));
    return r?.s ?? null;
  }
  async get(id: string) {
    const [r] = await this.db.select(cols).from(feedback).where(eq(feedback.id, id));
    return r ?? null;
  }
  async adminList(filter: FeedbackFilter, limit: number) {
    const where: SQL[] = [];
    if (filter.status) where.push(eq(feedback.status, filter.status));
    if (filter.type) where.push(eq(feedback.type, filter.type));
    const rows = await this.db
      .select({
        ...cols,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        plan: sql<string | null>`(select ${subscriptions.plan} from ${subscriptions} where ${subscriptions.userId} = ${outerUserId} and ${subscriptions.currentPeriodEnd} > now())`,
      })
      .from(feedback)
      .innerJoin(user, eq(user.id, feedback.ownerId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(feedback.createdAt))
      .limit(limit);
    return rows.map(({ name, email, phone, plan, ...f }): AdminFeedback => ({
      ...f,
      owner: { name, contact: phoneOnly(email) ? (phone ?? "") : email, plan: plan === "starter" || plan === "business" ? plan : "free" },
    }));
  }
  async countByStatus() {
    const rows = await this.db.select({ status: feedback.status, n: count() }).from(feedback).groupBy(feedback.status);
    const c = emptyCounts();
    for (const r of rows) c[r.status] = Number(r.n);
    return c;
  }
  async setStatus(id: string, status: FeedbackStatus) {
    // The old value comes back from the same statement, so the audit entry can't name a stale one.
    const rows = await this.db.execute<{ before: FeedbackStatus }>(
      sql`update ${feedback} f set status = ${status}, updated_at = now() from (select id, status as before from ${feedback} where id = ${id} for update) old where f.id = old.id returning old.before`,
    );
    const list = Array.isArray(rows) ? rows : (rows as unknown as { rows: { before: FeedbackStatus }[] }).rows;
    return list[0]?.before ?? null;
  }
  async reply(id: string, text: string, adminId: string) {
    const rows = await this.db
      .update(feedback)
      .set({ reply: text, repliedBy: adminId, repliedAt: sql`now()`, replyReadAt: null, updatedAt: sql`now()` })
      .where(eq(feedback.id, id))
      .returning({ id: feedback.id });
    return rows.length > 0;
  }
}
