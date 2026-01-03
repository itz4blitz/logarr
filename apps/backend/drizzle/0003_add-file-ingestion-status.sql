-- Add file ingestion status tracking columns to servers table
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "file_ingestion_connected" boolean NOT NULL DEFAULT false;
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "file_ingestion_error" text;
