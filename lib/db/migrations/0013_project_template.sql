ALTER TABLE "projects" ADD COLUMN "template_id" text;--> statement-breakpoint
CREATE INDEX "projects_template_idx" ON "projects" USING btree ("template_id");