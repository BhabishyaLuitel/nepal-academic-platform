-- AlterTable
ALTER TABLE "Rubric" ADD COLUMN     "curriculumUnitId" TEXT,
ADD COLUMN     "createdByTeacherId" TEXT;

-- DropIndex
DROP INDEX "Rubric_curriculumSubjectId_order_key";

-- CreateIndex
CREATE INDEX "Rubric_curriculumUnitId_idx" ON "Rubric"("curriculumUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_curriculumSubjectId_curriculumUnitId_order_key" ON "Rubric"("curriculumSubjectId", "curriculumUnitId", "order");

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_curriculumUnitId_fkey" FOREIGN KEY ("curriculumUnitId") REFERENCES "CurriculumUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_createdByTeacherId_fkey" FOREIGN KEY ("createdByTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
