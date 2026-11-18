import { and, count, desc, eq, sql } from "drizzle-orm";
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
   * Pending → rewarded, once (atomic on the row): the invited owner gets `credits`, the inviter
   * too unless they already earned `cap` rewards since `since`. Null when not pending.
   */
  claim(referredId: string, paymentId: string, credits: number, cap: number, since: Date, now: Date): Promise<Claimed | null>;
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

  async claim(referredId: string, paymentId: string, credits: number, cap: number, since: Date, now: Date): Promise<Claimed | null> {
    // One statement: the row moves out of pending once, and the inviter's rewards this month are counted in it.
    const rows = await this.db
      .update(referrals)
      .set({
        status: "rewarded",
        paymentId,
        rewardedAt: now,
        referredCredits: credits,
        referrerCredits: sql`case when (select count(*) from ${referrals} as earned where earned.referrer_id = ${referrals.referrerId} and earned.rewarded_at >= ${since} and earned.referrer_credits > 0) < ${cap} then ${credits} else 0 end`,
      })
      .where(and(eq(referrals.referredId, referredId), eq(referrals.status, "pending")))
      .returning({ referrerId: referrals.referrerId, referrerCredits: referrals.referrerCredits, referredCredits: referrals.referredCredits });
    return rows[0] ?? null;
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
  constructor(private people: (id: string) => MemoryPerson | null = () => null) {}

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
  async claim(referredId: string, paymentId: string, credits: number, cap: number, since: Date, now: Date) {
    const r = this.rows.get(referredId);
    if (!r || r.status !== "pending") return null;
    const earned = [...this.rows.values()].filter((x) => x.referrerId === r.referrerId && x.rewardedAt && x.rewardedAt >= since && x.referrerCredits > 0).length;
    Object.assign(r, { status: "rewarded", paymentId, rewardedAt: now, referredCredits: credits, referrerCredits: earned < cap ? credits : 0 });
    return { referrerId: r.referrerId, referrerCredits: r.referrerCredits, referredCredits: r.referredCredits };
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

