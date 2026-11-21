CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" text NOT NULL,
	"time" text NOT NULL,
	"kind" text NOT NULL,
	"subject" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"caption_en" text DEFAULT '' NOT NULL,
	"caption_am" text DEFAULT '' NOT NULL,
	"hashtags" text DEFAULT '' NOT NULL,
	"media" jsonb,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "social_posts_day_idx" ON "social_posts" USING btree ("day");--> statement-breakpoint
CREATE INDEX "social_posts_due_idx" ON "social_posts" USING btree ("status","day");