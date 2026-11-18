ALTER TABLE "sites" ADD COLUMN "showcase" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "showcase_hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "showcase_image" text;--> statement-breakpoint
CREATE INDEX "sites_showcase_idx" ON "sites" USING btree ("published_at") WHERE "sites"."showcase" and "sites"."status" = 'published';