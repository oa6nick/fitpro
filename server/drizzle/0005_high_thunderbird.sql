ALTER TABLE "clients" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "period_start" date;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "period_end" date;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "reminded_at" timestamp with time zone;