CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'high', 'medium', 'low', 'info');--> statement-breakpoint
CREATE TYPE "public"."issue_source" AS ENUM('jellyfin', 'sonarr', 'radarr', 'prowlarr', 'docker', 'system');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('open', 'acknowledged', 'in_progress', 'resolved', 'ignored');--> statement-breakpoint
CREATE TABLE "ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid,
	"log_entry_id" uuid,
	"session_id" uuid,
	"provider" text NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"api_key" text,
	"base_url" text,
	"model" text NOT NULL,
	"max_tokens" integer DEFAULT 1000,
	"temperature" real DEFAULT 0.7,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_tested_at" timestamp with time zone,
	"last_test_result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"log_entry_id" uuid NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"server_id" uuid,
	"user_id" text,
	"session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sources" text[],
	"pattern" text NOT NULL,
	"is_regex" boolean DEFAULT false NOT NULL,
	"suggested_severity" "issue_severity" DEFAULT 'medium' NOT NULL,
	"suggested_category" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"match_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" "issue_source" NOT NULL,
	"severity" "issue_severity" DEFAULT 'medium' NOT NULL,
	"status" "issue_status" DEFAULT 'open' NOT NULL,
	"server_id" uuid,
	"category" text,
	"error_pattern" text NOT NULL,
	"sample_message" text NOT NULL,
	"exception_type" text,
	"first_seen" timestamp with time zone NOT NULL,
	"last_seen" timestamp with time zone NOT NULL,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"affected_users_count" integer DEFAULT 0 NOT NULL,
	"affected_sessions_count" integer DEFAULT 0 NOT NULL,
	"impact_score" real DEFAULT 0 NOT NULL,
	"ai_analysis" text,
	"ai_analysis_at" timestamp with time zone,
	"ai_suggested_fix" text,
	"related_links" jsonb,
	"notes" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issues_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"external_activity_id" text,
	"timestamp" timestamp with time zone NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"source" text,
	"thread_id" text,
	"raw" text NOT NULL,
	"session_id" text,
	"user_id" text,
	"device_id" text,
	"item_id" text,
	"play_session_id" text,
	"metadata" jsonb,
	"exception" text,
	"stack_trace" text,
	"search_vector" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playback_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"item_id" text,
	"item_name" text,
	"item_type" text,
	"position_ticks" bigint,
	"duration_ticks" bigint,
	"is_paused" boolean DEFAULT false NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"is_transcoding" boolean DEFAULT false NOT NULL,
	"transcode_reasons" text[],
	"video_codec" text,
	"audio_codec" text,
	"container" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider_id" text NOT NULL,
	"url" text NOT NULL,
	"api_key" text NOT NULL,
	"log_path" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"last_seen" timestamp with time zone,
	"last_error" text,
	"version" text,
	"server_name" text,
	"last_activity_sync" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"play_session_id" text,
	"user_id" text,
	"user_name" text,
	"device_id" text NOT NULL,
	"device_name" text,
	"client_name" text,
	"client_version" text,
	"ip_address" text,
	"now_playing_item_id" text,
	"now_playing_item_name" text,
	"now_playing_item_type" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"last_activity" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_log_entry_id_log_entries_id_fk" FOREIGN KEY ("log_entry_id") REFERENCES "public"."log_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_occurrences" ADD CONSTRAINT "issue_occurrences_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_occurrences" ADD CONSTRAINT "issue_occurrences_log_entry_id_log_entries_id_fk" FOREIGN KEY ("log_entry_id") REFERENCES "public"."log_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_occurrences" ADD CONSTRAINT "issue_occurrences_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playback_events" ADD CONSTRAINT "playback_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_analyses_server_id_idx" ON "ai_analyses" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "ai_analyses_log_entry_id_idx" ON "ai_analyses" USING btree ("log_entry_id");--> statement-breakpoint
CREATE INDEX "ai_analyses_session_id_idx" ON "ai_analyses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_provider_settings_provider_idx" ON "ai_provider_settings" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_provider_settings_is_default_idx" ON "ai_provider_settings" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "issue_occurrences_issue_id_idx" ON "issue_occurrences" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_occurrences_log_entry_id_idx" ON "issue_occurrences" USING btree ("log_entry_id");--> statement-breakpoint
CREATE INDEX "issue_occurrences_timestamp_idx" ON "issue_occurrences" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_occurrences_issue_log_idx" ON "issue_occurrences" USING btree ("issue_id","log_entry_id");--> statement-breakpoint
CREATE INDEX "issue_patterns_is_enabled_idx" ON "issue_patterns" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "issue_patterns_is_system_idx" ON "issue_patterns" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "issues_fingerprint_idx" ON "issues" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "issues_server_id_idx" ON "issues" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "issues_source_idx" ON "issues" USING btree ("source");--> statement-breakpoint
CREATE INDEX "issues_severity_idx" ON "issues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "issues_status_idx" ON "issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "issues_category_idx" ON "issues" USING btree ("category");--> statement-breakpoint
CREATE INDEX "issues_last_seen_idx" ON "issues" USING btree ("last_seen");--> statement-breakpoint
CREATE INDEX "issues_impact_score_idx" ON "issues" USING btree ("impact_score");--> statement-breakpoint
CREATE INDEX "issues_occurrence_count_idx" ON "issues" USING btree ("occurrence_count");--> statement-breakpoint
CREATE INDEX "log_entries_server_id_idx" ON "log_entries" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "log_entries_timestamp_idx" ON "log_entries" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "log_entries_level_idx" ON "log_entries" USING btree ("level");--> statement-breakpoint
CREATE INDEX "log_entries_source_idx" ON "log_entries" USING btree ("source");--> statement-breakpoint
CREATE INDEX "log_entries_session_id_idx" ON "log_entries" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "log_entries_user_id_idx" ON "log_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "log_entries_play_session_id_idx" ON "log_entries" USING btree ("play_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "log_entries_server_external_id_idx" ON "log_entries" USING btree ("server_id","external_activity_id");--> statement-breakpoint
CREATE INDEX "playback_events_session_id_idx" ON "playback_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "playback_events_timestamp_idx" ON "playback_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "playback_events_event_type_idx" ON "playback_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "servers_provider_id_idx" ON "servers" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "servers_is_enabled_idx" ON "servers" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "sessions_server_id_idx" ON "sessions" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "sessions_external_id_idx" ON "sessions" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_device_id_idx" ON "sessions" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "sessions_is_active_idx" ON "sessions" USING btree ("is_active");