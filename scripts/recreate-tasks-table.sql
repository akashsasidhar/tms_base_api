-- Recreate tasks table
-- This script recreates the tasks table that was manually deleted

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE "enum_tasks_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_tasks_status" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tasks table
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" "enum_tasks_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "enum_tasks_status" NOT NULL DEFAULT 'TODO',
    "created_by" UUID NOT NULL,
    "started_date" TIMESTAMP WITH TIME ZONE,
    "due_date" TIMESTAMP WITH TIME ZONE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    "deleted_by" UUID,
    CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT "tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT "tasks_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks" ("project_id");
CREATE INDEX IF NOT EXISTS "tasks_created_by_idx" ON "tasks" ("created_by");
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks" ("priority");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "tasks_is_active_idx" ON "tasks" ("is_active");
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks" ("due_date");
