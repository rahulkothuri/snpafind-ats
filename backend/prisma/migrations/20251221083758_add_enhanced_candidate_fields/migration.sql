/*
  Warnings:

  - Made the column `department` on table `jobs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "candidate_summary" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "internal_mobility" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "job_domain" TEXT,
ADD COLUMN     "tags" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "department" SET NOT NULL;
