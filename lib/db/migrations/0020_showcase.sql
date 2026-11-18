CREATE TABLE "site_showcase" (
	"site_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"thumb" "bytea",
	"thumb_key" text,
	"thumb_width" integer,
	"thumb_height" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "showcase" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "showcase_hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site_showcase" ADD CONSTRAINT "site_showcase_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_showcase_thumb_idx" ON "site_showcase" USING btree ("thumb_key");--> statement-breakpoint
CREATE INDEX "sites_showcase_idx" ON "sites" USING btree ("published_at") WHERE "sites"."showcase" and "sites"."status" = 'published';