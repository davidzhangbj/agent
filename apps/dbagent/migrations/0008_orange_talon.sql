CREATE TABLE "oba_obdoc" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text,
	"metadata" jsonb NOT NULL,
	"embedding" vector(768) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oba_obdoc" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE INDEX "idx_oba_obdoc_id" ON "oba_obdoc" USING btree ("id");--> statement-breakpoint
