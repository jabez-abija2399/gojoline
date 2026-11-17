CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"rating" integer,
	"page" text,
	"locale" text NOT NULL,
	"device" text NOT NULL,
	"user_agent" text,
	"screenshot" "bytea",
	"thumbnail" "bytea",
	"screenshot_bytes" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"reply" text,
	"replied_by" text,
	"replied_at" timestamp with time zone,
	"reply_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_owner_idx" ON "feedback" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "feedback_unread_idx" ON "feedback" USING btree ("owner_id") WHERE "feedback"."reply" is not null and "feedback"."reply_read_at" is null;