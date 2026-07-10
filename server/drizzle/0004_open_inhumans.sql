CREATE TABLE "exercise_alternatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"alternative_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_exercises" ADD COLUMN "group_key" text;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD COLUMN "group_type" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "group_key" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "group_type" text;--> statement-breakpoint
ALTER TABLE "exercise_alternatives" ADD CONSTRAINT "exercise_alternatives_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_alternatives" ADD CONSTRAINT "exercise_alternatives_alternative_id_exercises_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;