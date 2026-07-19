CREATE INDEX "device_tokens_user_idx" ON "device_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_intents_trainer_idx" ON "payment_intents" USING btree ("trainer_id");