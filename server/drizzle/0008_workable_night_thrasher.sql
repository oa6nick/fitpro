CREATE TABLE "payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"amount_rub" real NOT NULL,
	"provider_payment_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "payment_intents_provider_payment_id_unique" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;