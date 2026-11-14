import { bigint, boolean, customType, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId, t.updatedAt)],
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
  (t) => [index("ai_usage_user_idx").on(t.userId, t.createdAt), index("ai_usage_project_idx").on(t.projectId)],
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
    url: text("url"),
    status: text("status", { enum: ["pending", "published", "taken_down"] }).notNull(),
    publishedVersion: integer("published_version"),
    lastDeploymentId: text("last_deployment_id"),
    customDomain: text("custom_domain").unique(),
    /** Public key the published site sends with form submissions (identifies the site, not a secret). */
    siteKey: text("site_key"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    takenDownReason: text("taken_down_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sites_owner_idx").on(t.ownerId)],
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
    createdAt: createdAt(),
  },
  (t) => [index("form_submissions_owner_idx").on(t.ownerId, t.projectId, t.createdAt)],
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
