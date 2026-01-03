CREATE TYPE "public"."log_source" AS ENUM('api', 'file');--> statement-breakpoint
CREATE TABLE "log_file_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"absolute_path" text NOT NULL,
	"file_size" bigint DEFAULT 0 NOT NULL,
	"byte_offset" bigint DEFAULT 0 NOT NULL,
	"line_number" integer DEFAULT 0 NOT NULL,
	"file_inode" text,
	"file_modified_at" timestamp with time zone,
	"last_read_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "log_source" "log_source" DEFAULT 'api' NOT NULL;--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "log_file_path" text;--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "log_file_line" integer;--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "deduplication_key" text;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "file_ingestion_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "log_paths" text[];--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "log_file_patterns" text[];--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "last_file_sync" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "log_file_state" ADD CONSTRAINT "log_file_state_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "log_file_state_server_file_idx" ON "log_file_state" USING btree ("server_id","file_path");--> statement-breakpoint
CREATE INDEX "log_file_state_server_id_idx" ON "log_file_state" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "log_file_state_is_active_idx" ON "log_file_state" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "log_entries_log_source_idx" ON "log_entries" USING btree ("log_source");--> statement-breakpoint
CREATE UNIQUE INDEX "log_entries_server_dedup_key_idx" ON "log_entries" USING btree ("server_id","deduplication_key");