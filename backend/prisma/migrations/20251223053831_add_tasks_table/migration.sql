-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('feedback', 'approval', 'reminder', 'pipeline');

-- CreateEnum
CREATE TYPE "task_severity" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "task_type" NOT NULL,
    "text" TEXT NOT NULL,
    "severity" "task_severity" NOT NULL DEFAULT 'medium',
    "status" "task_status" NOT NULL DEFAULT 'open',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_company_id_user_id_idx" ON "tasks"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
