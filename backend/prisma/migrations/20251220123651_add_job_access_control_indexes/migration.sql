-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE INDEX "jobs_assigned_recruiter_id_idx" ON "jobs"("assigned_recruiter_id");

-- CreateIndex
CREATE INDEX "jobs_company_id_assigned_recruiter_id_idx" ON "jobs"("company_id", "assigned_recruiter_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");
