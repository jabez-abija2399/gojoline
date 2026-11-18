CREATE TABLE "signup_sources" (
	"user_id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"ref" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"referrer_host" text,
	"first_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signup_sources" ADD CONSTRAINT "signup_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "signup_sources_time_idx" ON "signup_sources" USING btree ("created_at");