CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"source" text NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"external_id" text,
	"external_url" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;