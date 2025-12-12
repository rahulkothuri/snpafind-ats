-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'hiring_manager', 'recruiter');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('active', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('stage_change', 'note_added', 'resume_uploaded', 'interview_scheduled', 'score_updated');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "contact_email" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'recruiter',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employment_type" TEXT,
    "salary_range" TEXT,
    "description" TEXT,
    "status" "job_status" NOT NULL DEFAULT 'active',
    "openings" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "experience_years" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_company" TEXT,
    "location" TEXT NOT NULL,
    "current_ctc" TEXT,
    "expected_ctc" TEXT,
    "notice_period" TEXT,
    "source" TEXT NOT NULL,
    "availability" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "resume_url" TEXT,
    "score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_candidates" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "current_stage_id" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_activities" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_candidate_id" TEXT,
    "activity_type" "activity_type" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_job_id_position_key" ON "pipeline_stages"("job_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "job_candidates_job_id_candidate_id_key" ON "job_candidates"("job_id", "candidate_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_candidates" ADD CONSTRAINT "job_candidates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_candidates" ADD CONSTRAINT "job_candidates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_candidates" ADD CONSTRAINT "job_candidates_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_activities" ADD CONSTRAINT "candidate_activities_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_activities" ADD CONSTRAINT "candidate_activities_job_candidate_id_fkey" FOREIGN KEY ("job_candidate_id") REFERENCES "job_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
