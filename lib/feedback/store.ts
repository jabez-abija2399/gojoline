import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, isNotNull, isNull, lt, sql, type SQL } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { auditLog, feedback, subscriptions, user } from "@/lib/db/schema";
import { outerUserId } from "@/lib/admin/stats";
import {
  AUDIT_REPLY_MAX,
  emptyCounts,
  type AdminFeedback,
  type Feedback,
  type FeedbackFilter,
  type FeedbackInput,
  type FeedbackOwner,
  type FeedbackStatus,
  type FeedbackStore,
  type FeedbackUpdate,
  type ShotSize,
} from "./types";

type Row = Feedback & { screenshot: Buffer | null; thumbnail: Buffer | null; screenshotBytes: number; repliedBy: string | null };
type Audit = (e: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) => Promise<void>;

const strip = ({ screenshot: _s, thumbnail: _t, screenshotBytes: _b, repliedBy: _r, ...f }: Row): Feedback => (void [_s, _t, _b, _r], f);

/** Development and e2e: kept in process memory. `ownerInfo` fills in the admin's view of who sent it. */
export class MemoryFeedbackStore implements FeedbackStore {
  readonly rows: Row[] = [];
  constructor(
    private ownerInfo: (ownerId: string) => Promise<FeedbackOwner | null> = async () => null,
    private audit: Audit = async () => undefined,
  ) {}

  async add(ownerId: string, input: FeedbackInput, shot: { full: Buffer; thumb: Buffer } | null) {
    const row: Row = {
      ...input, id: randomUUID(), ownerId, screenshot: shot?.full ?? null, thumbnail: shot?.thumb ?? null, screenshotBytes: shot?.full.length ?? 0,
      hasScreenshot: !!shot, status: "new", reply: null, repliedBy: null, repliedAt: null, replyReadAt: null, createdAt: new Date(),
    };
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
  async screenshot(id: string, ownerId: string | null, size: ShotSize) {
    const r = this.rows.find((x) => x.id === id && (ownerId === null || x.ownerId === ownerId));
    return (size === "thumb" ? r?.thumbnail : r?.screenshot) ?? null;
  }
  async screenshotBytes(ownerId: string, since: Date | null) {
    return this.rows.filter((r) => r.ownerId === ownerId && r.screenshot && (!since || r.createdAt >= since)).reduce((n, r) => n + r.screenshotBytes, 0);
  }
  async purgeScreenshots(before: Date) {
    let n = 0;
    for (const r of this.rows) {
      if (r.createdAt >= before || !r.screenshot) continue;
      Object.assign(r, { screenshot: null, thumbnail: null, hasScreenshot: false });
      n++;
    }
    return n;
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
  /** Synchronous up to the audit calls, so nothing else runs in between (one event-loop turn). */
  async update(id: string, adminId: string, input: { status: FeedbackStatus; reply: string }): Promise<FeedbackUpdate> {
    const r = this.rows.find((x) => x.id === id);
    if (!r) return { outcome: "not_found" };
    const reply = input.reply.trim();
    const replyChanged = reply.length > 0 && reply !== (r.reply ?? "");
    const from = r.status;
    const to: FeedbackStatus = replyChanged && input.status === "new" ? "seen" : input.status;
    if (replyChanged) Object.assign(r, { reply, repliedBy: adminId, repliedAt: new Date(), replyReadAt: null });
    r.status = to;
    if (replyChanged) await this.audit({ actorId: adminId, action: "feedback.reply", targetType: "feedback", targetId: id, data: { length: reply.length, text: reply.slice(0, AUDIT_REPLY_MAX) } });
    if (from !== to) await this.audit({ actorId: adminId, action: "feedback.status", targetType: "feedback", targetId: id, data: { from, to } });
    return { outcome: replyChanged || from !== to ? "ok" : "unchanged", from, to, replyChanged };
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

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] }).rows ?? []) as T[];
}

/** Neon Postgres. Owner reads always filter by owner_id; image columns are read only on their own route. */
export class DbFeedbackStore implements FeedbackStore {
  constructor(private db: Database) {}

  async add(ownerId: string, input: FeedbackInput, shot: { full: Buffer; thumb: Buffer } | null) {
    const [row] = await this.db
      .insert(feedback)
      .values({ ...input, ownerId, screenshot: shot?.full ?? null, thumbnail: shot?.thumb ?? null, screenshotBytes: shot?.full.length ?? 0 })
      .returning(cols);
    return row!;
  }
  async listForOwner(ownerId: string, limit: number) {
    return this.db.select(cols).from(feedback).where(eq(feedback.ownerId, ownerId)).orderBy(desc(feedback.createdAt)).limit(limit);
  }
  async unreadReplies(ownerId: string) {
    // Matches the partial index feedback_unread_idx.
    const [r] = await this.db.select({ n: count() }).from(feedback).where(and(eq(feedback.ownerId, ownerId), isNotNull(feedback.reply), isNull(feedback.replyReadAt)));
    return Number(r?.n ?? 0);
  }
  async markRepliesRead(ownerId: string) {
    await this.db.update(feedback).set({ replyReadAt: sql`now()` }).where(and(eq(feedback.ownerId, ownerId), isNotNull(feedback.reply), isNull(feedback.replyReadAt)));
  }
  async screenshot(id: string, ownerId: string | null, size: ShotSize) {
    const [r] = await this.db
      .select({ s: size === "thumb" ? feedback.thumbnail : feedback.screenshot })
      .from(feedback)
      .where(and(eq(feedback.id, id), ownerId === null ? undefined : eq(feedback.ownerId, ownerId)));
    return r?.s ?? null;
  }
  async screenshotBytes(ownerId: string, since: Date | null) {
    const [r] = await this.db
      .select({ n: sql<number>`coalesce(sum(${feedback.screenshotBytes}), 0)::bigint` })
      .from(feedback)
      .where(and(eq(feedback.ownerId, ownerId), isNotNull(feedback.screenshot), since ? gte(feedback.createdAt, since) : undefined));
    return Number(r?.n ?? 0);
  }
  async purgeScreenshots(before: Date) {
    const rows = await this.db
      .update(feedback)
      .set({ screenshot: null, thumbnail: null })
      .where(and(lt(feedback.createdAt, before), isNotNull(feedback.screenshot)))
      .returning({ id: feedback.id });
    return rows.length;
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
  /** One statement: the row is locked, changed and both audit entries written together, or nothing is. */
  async update(id: string, adminId: string, input: { status: FeedbackStatus; reply: string }): Promise<FeedbackUpdate> {
    const reply = input.reply.trim();
    const result = await this.db.execute(sql`
      with old as (
        select id, status, reply from ${feedback} where id = ${id}::uuid for update
      ), calc as (
        select id, status as old_status, (${reply}::text <> '' and ${reply}::text is distinct from reply) as reply_changed from old
      ), calc2 as (
        select *, case when reply_changed and ${input.status}::text = 'new' then 'seen' else ${input.status}::text end as new_status from calc
      ), upd as (
        update ${feedback} f set
          status = c.new_status,
          reply = case when c.reply_changed then ${reply}::text else f.reply end,
          replied_by = case when c.reply_changed then ${adminId}::text else f.replied_by end,
          replied_at = case when c.reply_changed then now() else f.replied_at end,
          reply_read_at = case when c.reply_changed then null else f.reply_read_at end,
          updated_at = now()
        from calc2 c where f.id = c.id
        returning c.old_status, c.new_status, c.reply_changed
      ), a_reply as (
        insert into ${auditLog} (actor_id, action, target_type, target_id, data)
        select ${adminId}::text, 'feedback.reply', 'feedback', ${id}::text,
          jsonb_build_object('length', char_length(${reply}::text), 'text', left(${reply}::text, ${AUDIT_REPLY_MAX}::int))
        from upd where reply_changed
      ), a_status as (
        insert into ${auditLog} (actor_id, action, target_type, target_id, data)
        select ${adminId}::text, 'feedback.status', 'feedback', ${id}::text, jsonb_build_object('from', old_status, 'to', new_status)
        from upd where old_status <> new_status
      )
      select old_status, new_status, reply_changed from upd`);
    const r = rowsOf<{ old_status: FeedbackStatus; new_status: FeedbackStatus; reply_changed: boolean }>(result)[0];
    if (!r) return { outcome: "not_found" };
    return { outcome: r.reply_changed || r.old_status !== r.new_status ? "ok" : "unchanged", from: r.old_status, to: r.new_status, replyChanged: r.reply_changed };
  }
}
