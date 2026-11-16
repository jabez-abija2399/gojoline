import { bigint, boolean, customType, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// Better Auth tables (field names must match Better Auth's model; columns are snake_case).
// ---------------------------------------------------------------------------
export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified").default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const account = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

// ---------------------------------------------------------------------------
// Gojoline data. Every row that belongs to a customer carries owner_id; queries filter on it.
// ---------------------------------------------------------------------------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    locale: text("locale", { enum: ["en", "am"] }).notNull(),
    /** The template (preset id) the project started from; null for chat-first sites and older rows. */
    templateId: text("template_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId, t.updatedAt), index("projects_template_idx").on(t.templateId, t.ownerId).where(sql`${t.templateId} is not null`)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    role: text("role", { enum: ["owner", "assistant"] }).notNull(),
    text: text("text").notNull(),
    status: text("status", { enum: ["changed", "answered", "failed"] }),
    versionNumber: integer("version_number"),
    createdAt: createdAt(),
  },
  (t) => [index("messages_project_idx").on(t.projectId, t.createdAt)],
);

/** Each AI change is a full snapshot of the editable files (R2 later; jsonb until R2 is set up). */
export const projectVersions = pgTable(
  "project_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    number: integer("number").notNull(),
    summary: text("summary").notNull(),
    files: jsonb("files").$type<Record<string, string>>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("project_versions_number_uq").on(t.projectId, t.number)],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    projectId: uuid("project_id"),
    purpose: text("purpose").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cacheReadTokens: integer("cache_read_tokens").notNull(),
    cacheWriteTokens: integer("cache_write_tokens").notNull(),
    /** Integer nano-USD (1e-9 USD). */
    costNanoUsd: bigint("cost_nano_usd", { mode: "number" }).notNull(),
    durationMs: integer("duration_ms").notNull(),
    firstTokenMs: integer("first_token_ms"),
    stopReason: text("stop_reason"),
    ok: boolean("ok").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ai_usage_user_idx").on(t.userId, t.createdAt), index("ai_usage_project_idx").on(t.projectId), index("ai_usage_created_idx").on(t.createdAt)],
);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactKind: text("contact_kind", { enum: ["phone", "email"] }).notNull(),
  contactValue: text("contact_value").notNull().unique(),
  business: text("business"),
  locale: text("locale", { enum: ["en", "am"] }).notNull(),
  createdAt: createdAt(),
});


/** A project's public site. One per project; slug is the public address part. */
export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // restrict: a project with a site can't vanish while its site stays online (takedown/audit).
    projectId: uuid("project_id")
      .notNull()
      .unique()
      .references(() => projects.id, { onDelete: "restrict" }),
    ownerId: text("owner_id").notNull(),
    slug: text("slug").notNull().unique(),
    provider: text("provider").notNull(),
    providerProjectId: text("provider_project_id"),
    /** The previous host's project after a move, until its forward is confirmed (takedowns reach it too). */
    legacyProjectId: text("legacy_project_id"),
    url: text("url"),
    status: text("status", { enum: ["pending", "published", "taken_down"] }).notNull(),
    publishedVersion: integer("published_version"),
    lastDeploymentId: text("last_deployment_id"),
    customDomain: text("custom_domain").unique(),
    /** When the owner connected the domain, and when its DNS was first confirmed (null = never). */
    customDomainClaimedAt: timestamp("custom_domain_claimed_at", { withTimezone: true }),
    customDomainVerifiedAt: timestamp("custom_domain_verified_at", { withTimezone: true }),
    /** Public key the published site sends with form submissions (identifies the site, not a secret). */
    siteKey: text("site_key"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    takenDownReason: text("taken_down_reason"),
    /** When the takedown notice replaced the live site (null: not yet, e.g. the deploy failed). */
    takedownDeployedAt: timestamp("takedown_deployed_at", { withTimezone: true }),
    /** The owner took the site offline ("resting"); null = online. Separate from an admin takedown. */
    offlineAt: timestamp("offline_at", { withTimezone: true }),
    /** Which live-site features the published files have (1: reads business info, counts visits); null = published before them. */
    runtimeVersion: integer("runtime_version"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sites_owner_idx").on(t.ownerId), index("sites_updated_idx").on(t.updatedAt)],
);

/** Form definitions captured from site.json at publish time; submissions are checked against them. */
export const siteForms = pgTable(
  "site_forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    formKey: text("form_key").notNull(),
    kind: text("kind").notNull(),
    definition: jsonb("definition").$type<Record<string, unknown>>().notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("site_forms_key_uq").on(t.siteId, t.formKey)],
);

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    ownerId: text("owner_id").notNull(),
    formKey: text("form_key").notNull(),
    kind: text("kind").notNull(),
    data: jsonb("data").$type<Record<string, string>>().notNull(),
    lang: text("lang"),
    readAt: timestamp("read_at", { withTimezone: true }),
    /** new → replied → done (the owner's progress on it). Replaces read/unread; read_at is kept. */
    status: text("status", { enum: ["new", "replied", "done"] }).notNull().default("new"),
    createdAt: createdAt(),
  },
  (t) => [index("form_submissions_owner_idx").on(t.ownerId, t.projectId, t.createdAt)],
);

/**
 * Details the owner edits in the dashboard without AI or a rebuild (contact, hours, banner),
 * and the Google and share preview applied on the next publish. One row per project.
 */
export const siteSettings = pgTable("site_settings", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  business: jsonb("business").$type<Record<string, unknown>>(),
  seo: jsonb("seo").$type<Record<string, unknown>>(),
  updatedAt: updatedAt(),
});

/** Visits per site per Addis Ababa day, rolled up from Redis (no IPs, no visitor ids). */
export const siteVisitsDaily = pgTable(
  "site_visits_daily",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    views: integer("views").notNull().default(0),
    visitors: integer("visitors").notNull().default(0),
    referrers: jsonb("referrers").$type<Record<string, number>>().notNull().default({}),
    devices: jsonb("devices").$type<Record<string, number>>().notNull().default({}),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("site_visits_daily_uq").on(t.projectId, t.day)],
);

/** Owner-uploaded photos (re-encoded WebP). Stored here until R2 is set up. */
export const projectAssets = pgTable(
  "project_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    size: integer("size").notNull(),
    data: bytea("data").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("project_assets_name_uq").on(t.projectId, t.name)],
);

/** An owner's Telegram chat, linked through a one-time code from the dashboard. */
export const telegramLinks = pgTable("telegram_links", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  chatId: text("chat_id").notNull().unique(),
  username: text("username"),
  locale: text("locale", { enum: ["en", "am"] }).notNull(),
  /** Which site bot edits apply to (the owner picks with /sites). */
  activeProjectId: uuid("active_project_id"),
  /** A bigger bot edit waiting for the owner's "yes" (request, size, when asked). */
  pendingEdit: jsonb("pending_edit").$type<{ projectId: string; text: string; size: "medium" | "large"; cost: number; at: string }>(),
  linkedAt: createdAt(),
});

export const telegramLinkCodes = pgTable("telegram_link_codes", {
  /** SHA-256 of the code; the code itself is only in the deep link. */
  codeHash: text("code_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  locale: text("locale", { enum: ["en", "am"] }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/** Telegram may deliver an update more than once; each is handled once. */
export const telegramUpdates = pgTable("telegram_updates", {
  updateId: bigint("update_id", { mode: "number" }).primaryKey(),
  receivedAt: createdAt(),
});

/** The plan a user pays for. No row = Free. */
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["starter", "business"] }).notNull(),
  period: text("period", { enum: ["month", "year"] }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  updatedAt: updatedAt(),
});

/** AI edit credits: balance = sum(delta). Grants are idempotent per (user, reason, ref). */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason", { enum: ["monthly_grant", "topup", "ai_edit", "refund", "admin", "first_build"] }).notNull(),
    ref: text("ref").notNull(),
    /** AI changes: how big the request was (small, medium, large), for the owner's history. */
    size: text("size", { enum: ["small", "medium", "large"] }),
    /** A short description shown in the owner's history (the start of the request). */
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("credit_ledger_ref_uq").on(t.userId, t.reason, t.ref), index("credit_ledger_user_time_idx").on(t.userId, t.createdAt)],
);

/** Running balance kept beside the ledger so a debit is one atomic `balance >= 1` update. */
export const creditBalances = pgTable("credit_balances", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  /** Changes given back today (refund_day, UTC), so the daily refund cap is checked in the same atomic update. */
  refundDay: date("refund_day", { mode: "string" }),
  refundUsed: integer("refund_used").notNull().default(0),
  /** What the last refund gave (read back by the same statement that wrote it). */
  refundLast: integer("refund_last").notNull().default(0),
});

/** Manual Birr payments (Telebirr / bank transfer) waiting for or after admin review. */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    product: text("product", { enum: ["starter_month", "starter_year", "business_month", "business_year", "topup"] }).notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency", { enum: ["ETB"] }).notNull(),
    method: text("method", { enum: ["telebirr", "cbe", "other"] }).notNull(),
    reference: text("reference").notNull(),
    receipt: bytea("receipt"),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    note: text("note"),
    /** Price before a discount (null when none applied); amount_minor is what the customer pays. */
    originalAmountMinor: integer("original_amount_minor"),
    discountMinor: integer("discount_minor"),
    /** "code" (a discount code) or "offer" (the site-wide launch offer). */
    discountSource: text("discount_source", { enum: ["code", "offer"] }),
    discountCode: text("discount_code"),
    createdAt: createdAt(),
  },
  (t) => [index("payments_status_idx").on(t.status, t.createdAt), index("payments_user_idx").on(t.userId, t.createdAt), uniqueIndex("payments_reference_uq").on(t.reference)],
);

/** Who did what, for money and moderation actions. Append-only. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_target_idx").on(t.targetType, t.targetId)],
);

/** Reports from the public (anyone can report a site; no account needed). */
export const abuseReports = pgTable(
  "abuse_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    reason: text("reason", { enum: ["phishing", "scam", "adult", "illegal_goods", "violence_hate", "impersonation", "copyright", "other"] }).notNull(),
    details: text("details"),
    contact: text("contact"),
    /** Salted hash of the reporter's network, to spot floods without storing IPs. */
    reporterKey: text("reporter_key").notNull(),
    status: text("status", { enum: ["open", "dismissed", "actioned"] }).notNull(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("abuse_reports_status_idx").on(t.status, t.createdAt),
    index("abuse_reports_site_idx").on(t.siteId),
    uniqueIndex("abuse_reports_open_uq").on(t.siteId, t.reporterKey).where(sql`${t.status} = 'open'`),
  ],
);

/** Settings the founder changes from the admin page (prices, payment accounts). */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedBy: text("updated_by"),
  updatedAt: updatedAt(),
});

/** Discount codes made by admins. Never deleted (payments keep the code); switched off instead. */
export const discountCodes = pgTable("discount_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Upper case A–Z and 0–9, 3 to 20 characters. */
  code: text("code").notNull().unique(),
  /** Exactly one of percent_off (1–90) or amount_off_minor (santim) is set. */
  percentOff: integer("percent_off"),
  amountOffMinor: integer("amount_off_minor"),
  products: jsonb("products").$type<string[]>().notNull(),
  maxUses: integer("max_uses"),
  /** Counted when a payment with the code is approved. */
  uses: integer("uses").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  firstPaymentOnly: boolean("first_payment_only").notNull().default(false),
  /** Each customer can use the code once (on by default). */
  perCustomerOnce: boolean("per_customer_once").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
});
