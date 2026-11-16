CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"percent_off" integer,
	"amount_off_minor" integer,
	"products" jsonb NOT NULL,
	"max_uses" integer,
	"uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"first_payment_only" boolean DEFAULT false NOT NULL,
	"per_customer_once" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "credit_balances" ADD COLUMN "refund_day" date;--> statement-breakpoint
ALTER TABLE "credit_balances" ADD COLUMN "refund_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_balances" ADD COLUMN "refund_last" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "original_amount_minor" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "discount_minor" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "discount_source" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "discount_code" text;--> statement-breakpoint
ALTER TABLE "telegram_links" ADD COLUMN "pending_edit" jsonb;--> statement-breakpoint
CREATE INDEX "credit_ledger_user_time_idx" ON "credit_ledger" USING btree ("user_id","created_at");