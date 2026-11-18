CREATE TABLE "referral_codes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_rewards_monthly" (
	"referrer_id" text NOT NULL,
	"month" text NOT NULL,
	"rewards" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "referral_rewards_monthly_referrer_id_month_pk" PRIMARY KEY("referrer_id","month")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"referred_id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"code" text NOT NULL,
	"status" text NOT NULL,
	"block_reason" text,
	"payment_id" uuid,
	"referrer_credits" integer DEFAULT 0 NOT NULL,
	"referred_credits" integer DEFAULT 0 NOT NULL,
	"rewarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards_monthly" ADD CONSTRAINT "referral_rewards_monthly_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id","rewarded_at");--> statement-breakpoint
CREATE INDEX "referrals_time_idx" ON "referrals" USING btree ("created_at");