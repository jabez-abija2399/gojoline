CREATE TABLE "credit_balances" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DROP INDEX "credit_ledger_user_idx";--> statement-breakpoint
DROP INDEX "payments_reference_uq";--> statement-breakpoint
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_reference_uq" ON "payments" USING btree ("reference");--> statement-breakpoint
INSERT INTO "credit_balances" ("user_id", "balance") SELECT "user_id", sum("delta")::int FROM "credit_ledger" GROUP BY "user_id" ON CONFLICT ("user_id") DO UPDATE SET "balance" = excluded."balance";
