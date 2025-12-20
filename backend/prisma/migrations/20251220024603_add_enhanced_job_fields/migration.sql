-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "age_up_to" INTEGER,
ADD COLUMN     "assigned_recruiter_id" TEXT,
ADD COLUMN     "education_qualification" TEXT,
ADD COLUMN     "experience_max" DOUBLE PRECISION,
ADD COLUMN     "experience_min" DOUBLE PRECISION,
ADD COLUMN     "job_domain" TEXT,
ADD COLUMN     "locations" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "preferred_industry" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'Medium',
ADD COLUMN     "salary_max" DOUBLE PRECISION,
ADD COLUMN     "salary_min" DOUBLE PRECISION,
ADD COLUMN     "skills" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "variables" TEXT,
ADD COLUMN     "work_mode" TEXT,
ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pipeline_stages" ADD COLUMN     "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_recruiter_id_fkey" FOREIGN KEY ("assigned_recruiter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
