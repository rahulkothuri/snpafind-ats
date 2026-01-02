-- ATS Comprehensive Enhancements Migration
-- Requirements: 8.1, 10.1, 10.4, 9.1, 6.5, 5.1

-- 1.1 Add score breakdown fields to Candidate model (Requirements: 8.1)
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "domain_score" INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "industry_score" INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "key_responsibilities_score" INTEGER;

-- 1.2 Add vendor role to UserRole enum (Requirements: 10.1)
DO $$ BEGIN
    ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'vendor';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.2 Create VendorJobAssignment table (Requirements: 10.4)
CREATE TABLE IF NOT EXISTS "vendor_job_assignments" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_job_assignments_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for vendor-job pair
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_job_assignments_vendor_id_job_id_key" ON "vendor_job_assignments"("vendor_id", "job_id");

-- Create indexes for vendor job assignments
CREATE INDEX IF NOT EXISTS "vendor_job_assignments_vendor_id_idx" ON "vendor_job_assignments"("vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_job_assignments_job_id_idx" ON "vendor_job_assignments"("job_id");

-- Add foreign key constraints (with existence check)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_job_assignments_vendor_id_fkey'
    ) THEN
        ALTER TABLE "vendor_job_assignments" ADD CONSTRAINT "vendor_job_assignments_vendor_id_fkey" 
        FOREIGN KEY ("vendor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_job_assignments_job_id_fkey'
    ) THEN
        ALTER TABLE "vendor_job_assignments" ADD CONSTRAINT "vendor_job_assignments_job_id_fkey" 
        FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 1.3 Add auto-rejection rules to Job model (Requirements: 9.1)
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "auto_rejection_rules" JSONB DEFAULT '{}';

-- 1.4 Add interview round type to Interview model (Requirements: 6.5)
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "round_type" TEXT;
