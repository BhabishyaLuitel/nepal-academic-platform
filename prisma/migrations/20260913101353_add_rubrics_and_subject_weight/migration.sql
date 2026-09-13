-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "creditWeight" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "curriculumSubjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level4" TEXT NOT NULL,
    "level3" TEXT NOT NULL,
    "level2" TEXT NOT NULL,
    "level1" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricScore" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rubricCriterionId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "recordedByTeacherId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RubricScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_curriculumSubjectId_order_key" ON "Rubric"("curriculumSubjectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "RubricCriterion_rubricId_order_key" ON "RubricCriterion"("rubricId", "order");

-- CreateIndex
CREATE INDEX "RubricScore_studentId_idx" ON "RubricScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricScore_studentId_rubricCriterionId_key" ON "RubricScore"("studentId", "rubricCriterionId");

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_curriculumSubjectId_fkey" FOREIGN KEY ("curriculumSubjectId") REFERENCES "CurriculumSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricScore" ADD CONSTRAINT "RubricScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricScore" ADD CONSTRAINT "RubricScore_rubricCriterionId_fkey" FOREIGN KEY ("rubricCriterionId") REFERENCES "RubricCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricScore" ADD CONSTRAINT "RubricScore_recordedByTeacherId_fkey" FOREIGN KEY ("recordedByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
