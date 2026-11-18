import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/lib/db/client";
import { referralCodes, referrals, user } from "@/lib/db/schema";
import { newReferralCode, type Person } from "./referral-rules";

export type ReferralStatus = "pending" | "rewarded" | "blocked";

export interface Referral {
  referredId: string;
  referrerId: string;
  code: string;
  status: ReferralStatus;
  blockReason: string | null;
  paymentId: string | null;
  referrerCredits: number;
  referredCredits: number;
  rewardedAt: Date | null;
  createdAt: Date;
}

export interface AdminReferral extends Referral {
  referrer: { name: string; contact: string };
  referred: { name: string; contact: string };
}

export interface Claimed {
  referrerId: string;
  referrerCredits: number;
  referredCredits: number;
}

export interface ReferralStore {
  /** The owner's invite code, made on first use. */
  codeFor(userId: string): Promise<string>;
  ownerOfCode(code: string): Promise<string | null>;
  /** Contact details, to spot an owner inviting themselves. */
  person(userId: string): Promise<Person | null>;
  /** Records who invited a new owner; false when the owner already has an inviter. */
  link(r: Pick<Referral, "referredId" | "referrerId" | "code" | "status" | "blockReason">): Promise<boolean>;
  get(referredId: string): Promise<Referral | null>;
  /**
   * Pending → rewarded and both credit grants, in one transaction: the invited owner gets
   * `credits`, the inviter too unless `cap` rewards in `month` (YYYY-MM) are already counted on
   * their monthly row (counted under its lock, so parallel approvals can't pass the cap). The
   * grants use ledger reason `referral`, ref `referral:<invited id>`. Null when not pending.
   */
  claim(referredId: string, paymentId: string, credits: number, cap: number, month: string, now: Date): Promise<Claimed | null>;
  /** Who invited these owners (for the admin's payment review). */
  inviters(referredIds: string[]): Promise<Map<string, { referrerId: string; name: string; contact: string; status: ReferralStatus; blockReason: string | null }>>;
  summary(referrerId: string): Promise<{ invited: number; rewarded: number; credits: number }>;
  recent(limit: number): Promise<AdminReferral[]>;
}

const contactOf = (email: string | null, phone: string | null) => (email && !email.endsWith("@phone.gojoline.invalid") ? email : (phone ?? ""));

export class DbReferralStore implements ReferralStore {
  constructor(private db: Database) {}

  async codeFor(userId: string): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const [row] = await this.db.select({ code: referralCodes.code }).from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
      if (row) return row.code;
      // A clash on the code (unlikely) or a parallel first visit: read again and retry.
      await this.db.insert(referralCodes).values({ userId, code: newReferralCode() }).onConflictDoNothing();
    }
    throw new Error("referral code not created");
  }

  async ownerOfCode(code: string): Promise<string | null> {
    const [row] = await this.db.select({ userId: referralCodes.userId }).from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
    return row?.userId ?? null;
  }

  async person(userId: string): Promise<Person | null> {
    const [row] = await this.db.select({ id: user.id, email: user.email, phone: user.phoneNumber }).from(user).where(eq(user.id, userId)).limit(1);
    return row ? { id: row.id, email: row.email.endsWith("@phone.gojoline.invalid") ? null : row.email, phone: row.phone } : null;
  }

  async link(r: Pick<Referral, "referredId" | "referrerId" | "code" | "status" | "blockReason">): Promise<boolean> {
    const rows = await this.db.insert(referrals).values(r).onConflictDoNothing().returning({ id: referrals.referredId });
    return rows.length > 0;
  }

  async get(referredId: string): Promise<Referral | null> {
    const [row] = await this.db.select().from(referrals).where(eq(referrals.referredId, referredId)).limit(1);
    return row ?? null;
  }

  async claim(referredId: string, paymentId: string, credits: number, cap: number, month: string, now: Date): Promise<Claimed | null> {
    const ref = `referral:${referredId}`;
    // One statement, so one transaction. The monthly row is locked by the upsert: a second
    // approval for the same inviter waits, then sees the new count.
    const result = await this.db.execute(sql`
      with target as (
        select referrer_id from referrals where referred_id = ${referredId} and status = 'pending'
      ),
      counted as (
        insert into referral_rewards_monthly (referrer_id, month, rewards)
        select referrer_id, ${month}, 1 from target
        on conflict (referrer_id, month) do update set rewards = referral_rewards_monthly.rewards + 1
        where referral_rewards_monthly.rewards < ${cap}
        returning referrer_id
      ),
      claimed as (
        update referrals set status = 'rewarded', payment_id = ${paymentId}, rewarded_at = ${now.toISOString()},
          referred_credits = ${credits}, referrer_credits = case when exists (select 1 from counted) then ${credits}::int else 0 end
        where referred_id = ${referredId} and status = 'pending'
        returning referrer_id, referrer_credits, referred_credits
      ),
      grants as (
        insert into credit_ledger (user_id, delta, reason, ref)
        select ${referredId}, referred_credits, 'referral', ${ref} from claimed
        union all
        select referrer_id, referrer_credits, 'referral', ${ref} from claimed where referrer_credits > 0
        on conflict do nothing
        returning user_id, delta
      ),
      balances as (
        insert into credit_balances (user_id, balance) select user_id, delta from grants
        on conflict (user_id) do update set balance = credit_balances.balance + excluded.balance
        returning user_id
      )
      select referrer_id as "referrerId", referrer_credits as "referrerCredits", referred_credits as "referredCredits", (select count(*) from balances)::int as granted from claimed`);
    const row = (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? []))[0] as (Claimed & { granted: number }) | undefined;
    return row ? { referrerId: row.referrerId, referrerCredits: Number(row.referrerCredits), referredCredits: Number(row.referredCredits) } : null;
  }

  async inviters(referredIds: string[]) {
    const out = new Map<string, { referrerId: string; name: string; contact: string; status: ReferralStatus; blockReason: string | null }>();
    if (referredIds.length === 0) return out;
    const rows = await this.db
      .select({ referredId: referrals.referredId, referrerId: referrals.referrerId, status: referrals.status, blockReason: referrals.blockReason, name: user.name, email: user.email, phone: user.phoneNumber })
      .from(referrals)
      .innerJoin(user, eq(user.id, referrals.referrerId))
      .where(inArray(referrals.referredId, referredIds));
    for (const r of rows) out.set(r.referredId, { referrerId: r.referrerId, name: r.name, contact: contactOf(r.email, r.phone), status: r.status, blockReason: r.blockReason });
    return out;
  }

  async summary(referrerId: string) {
    const [row] = await this.db
      .select({
        invited: count(),
        rewarded: sql<number>`count(*) filter (where ${referrals.status} = 'rewarded')::int`,
        credits: sql<number>`coalesce(sum(${referrals.referrerCredits}), 0)::int`,
      })
      .from(referrals)
      .where(and(eq(referrals.referrerId, referrerId), sql`${referrals.status} <> 'blocked'`));
    return { invited: Number(row?.invited ?? 0), rewarded: Number(row?.rewarded ?? 0), credits: Number(row?.credits ?? 0) };
  }

  async recent(limit: number): Promise<AdminReferral[]> {
    const inviter = alias(user, "inviter");
    const invited = alias(user, "invited");
    const rows = await this.db
      .select({
        r: referrals,
        aName: inviter.name,
        aEmail: inviter.email,
        aPhone: inviter.phoneNumber,
        bName: invited.name,
        bEmail: invited.email,
        bPhone: invited.phoneNumber,
      })
      .from(referrals)
      .innerJoin(inviter, eq(inviter.id, referrals.referrerId))
      .innerJoin(invited, eq(invited.id, referrals.referredId))
      .orderBy(desc(referrals.createdAt))
      .limit(limit);
    return rows.map((x) => ({ ...x.r, referrer: { name: x.aName, contact: contactOf(x.aEmail, x.aPhone) }, referred: { name: x.bName, contact: contactOf(x.bEmail, x.bPhone) } }));
  }
}

type MemoryPerson = { id: string; name: string; email: string; phoneNumber?: string | null };

/** Development and e2e: `people` reads the in-memory accounts. */
export class MemoryReferralStore implements ReferralStore {
  private codes = new Map<string, string>();
  private rows = new Map<string, Referral>();
  private monthly = new Map<string, number>();
  constructor(
    private people: (id: string) => MemoryPerson | null = () => null,
    /** The billing store's grant (idempotent per owner, reason and ref). */
    private grant: (userId: string, n: number, ref: string) => Promise<unknown> = async () => undefined,
  ) {}

  async codeFor(userId: string) {
    let code = this.codes.get(userId);
    while (!code || [...this.codes.entries()].some(([u, c]) => c === code && u !== userId)) code = newReferralCode();
    this.codes.set(userId, code);
    return code;
  }
  async ownerOfCode(code: string) {
    return [...this.codes.entries()].find(([, c]) => c === code)?.[0] ?? null;
  }
  async person(userId: string) {
    const p = this.people(userId);
    return p ? { id: p.id, email: p.email.endsWith("@phone.gojoline.invalid") ? null : p.email, phone: p.phoneNumber ?? null } : null;
  }
  async link(r: Pick<Referral, "referredId" | "referrerId" | "code" | "status" | "blockReason">) {
    if (this.rows.has(r.referredId)) return false;
    this.rows.set(r.referredId, { ...r, paymentId: null, referrerCredits: 0, referredCredits: 0, rewardedAt: null, createdAt: new Date() });
    return true;
  }
  async get(referredId: string) {
    return this.rows.get(referredId) ?? null;
  }
  async claim(referredId: string, paymentId: string, credits: number, cap: number, month: string, now: Date) {
    const r = this.rows.get(referredId);
    if (!r || r.status !== "pending") return null;
    // Synchronous up to the grants: nothing else runs in between on one event loop.
    const key = `${r.referrerId}:${month}`;
    const used = this.monthly.get(key) ?? 0;
    const counted = used < cap;
    if (counted) this.monthly.set(key, used + 1);
    Object.assign(r, { status: "rewarded", paymentId, rewardedAt: now, referredCredits: credits, referrerCredits: counted ? credits : 0 });
    await this.grant(referredId, credits, `referral:${referredId}`);
    if (counted) await this.grant(r.referrerId, credits, `referral:${referredId}`);
    return { referrerId: r.referrerId, referrerCredits: r.referrerCredits, referredCredits: r.referredCredits };
  }
  async inviters(referredIds: string[]) {
    const out = new Map<string, { referrerId: string; name: string; contact: string; status: ReferralStatus; blockReason: string | null }>();
    for (const id of referredIds) {
      const r = this.rows.get(id);
      if (!r) continue;
      const p = this.people(r.referrerId);
      out.set(id, { referrerId: r.referrerId, name: p?.name ?? "", contact: p ? contactOf(p.email, p.phoneNumber ?? null) : "", status: r.status, blockReason: r.blockReason });
    }
    return out;
  }
  async summary(referrerId: string) {
    const mine = [...this.rows.values()].filter((r) => r.referrerId === referrerId && r.status !== "blocked");
    return { invited: mine.length, rewarded: mine.filter((r) => r.status === "rewarded").length, credits: mine.reduce((n, r) => n + r.referrerCredits, 0) };
  }
  async recent(limit: number) {
    const who = (id: string) => {
      const p = this.people(id);
      return { name: p?.name ?? "", contact: p ? contactOf(p.email, p.phoneNumber ?? null) : "" };
    };
    return [...this.rows.values()]
      .sort((a, b) => +b.createdAt - +a.createdAt)
      .slice(0, limit)
      .map((r) => ({ ...r, referrer: who(r.referrerId), referred: who(r.referredId) }));
  }
}

