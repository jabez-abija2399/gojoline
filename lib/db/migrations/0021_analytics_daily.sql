CREATE TABLE "analytics_daily" (
	"day" date NOT NULL,
	"event" text NOT NULL,
	"key" text NOT NULL,
	"n" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_daily_day_event_key_pk" PRIMARY KEY("day","event","key")
);
