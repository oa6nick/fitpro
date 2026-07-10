ALTER TABLE "workouts" ADD COLUMN "review_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "trainer_comment" text;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "reviewed_at" timestamp with time zone;