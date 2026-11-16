CREATE TABLE "site_settings" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"business" jsonb,
	"seo" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits_daily" (
	"project_id" uuid NOT NULL,
	"day" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"visitors" integer DEFAULT 0 NOT NULL,
	"referrers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"devices" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "status" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "offline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "runtime_version" integer;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_visits_daily" ADD CONSTRAINT "site_visits_daily_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "site_visits_daily_uq" ON "site_visits_daily" USING btree ("project_id","day");--> statement-breakpoint
-- Read/unread becomes New/Replied/Done: unread stays New, read becomes Done (docs/DECISIONS.md 2026-11-16).
UPDATE "form_submissions" SET "status" = 'done' WHERE "read_at" IS NOT NULL;
