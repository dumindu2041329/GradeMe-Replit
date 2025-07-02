-- Add start_time column to exams table
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "start_time" timestamp;

-- Update the updated_at timestamp to reflect this change
UPDATE "exams" SET "updated_at" = NOW() WHERE "start_time" IS NOT NULL;