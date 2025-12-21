-- CreateTable
CREATE TABLE "pipeline_stage_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "stages" JSONB NOT NULL DEFAULT '[]',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stage_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_stage_templates_company_id_idx" ON "pipeline_stage_templates"("company_id");

-- CreateIndex
CREATE INDEX "pipeline_stage_templates_created_by_idx" ON "pipeline_stage_templates"("created_by");

-- CreateIndex
CREATE INDEX "pipeline_stage_templates_is_public_idx" ON "pipeline_stage_templates"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stage_templates_company_id_name_key" ON "pipeline_stage_templates"("company_id", "name");

-- AddForeignKey
ALTER TABLE "pipeline_stage_templates" ADD CONSTRAINT "pipeline_stage_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stage_templates" ADD CONSTRAINT "pipeline_stage_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
