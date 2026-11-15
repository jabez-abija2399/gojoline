ALTER TABLE "sites" ADD COLUMN "custom_domain_claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "custom_domain_verified_at" timestamp with time zone;