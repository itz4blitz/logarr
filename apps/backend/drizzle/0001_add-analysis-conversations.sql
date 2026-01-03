CREATE TABLE "analysis_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"context_snapshot" jsonb,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_conversations" ADD CONSTRAINT "analysis_conversations_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_conversations_issue_id_idx" ON "analysis_conversations" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "analysis_conversations_created_at_idx" ON "analysis_conversations" USING btree ("created_at");