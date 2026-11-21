CREATE TABLE "project_cards" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"heading" text,
	"primary_color" text,
	"background_color" text,
	"text_color" text,
	"thumb" "bytea",
	"thumb_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_cards" ADD CONSTRAINT "project_cards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;