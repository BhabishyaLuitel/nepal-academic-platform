-- CreateTable
CREATE TABLE "SkillArea" (
    "id" TEXT NOT NULL,
    "curriculumSubjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SkillArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAchievement" (
    "id" TEXT NOT NULL,
    "curriculumUnitId" TEXT NOT NULL,
    "skillAreaId" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "LearningAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScore" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "learningAchievementId" TEXT NOT NULL,
    "regularScore" INTEGER,
    "regularDate" TIMESTAMP(3),
    "remedialScore" INTEGER,
    "remedialDate" TIMESTAMP(3),
    "remark" TEXT,
    "recordedByTeacherId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillArea_curriculumSubjectId_order_key" ON "SkillArea"("curriculumSubjectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LearningAchievement_curriculumUnitId_skillAreaId_key" ON "LearningAchievement"("curriculumUnitId", "skillAreaId");

-- CreateIndex
CREATE INDEX "AssessmentScore_studentId_idx" ON "AssessmentScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentScore_studentId_learningAchievementId_key" ON "AssessmentScore"("studentId", "learningAchievementId");

-- AddForeignKey
ALTER TABLE "SkillArea" ADD CONSTRAINT "SkillArea_curriculumSubjectId_fkey" FOREIGN KEY ("curriculumSubjectId") REFERENCES "CurriculumSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAchievement" ADD CONSTRAINT "LearningAchievement_curriculumUnitId_fkey" FOREIGN KEY ("curriculumUnitId") REFERENCES "CurriculumUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAchievement" ADD CONSTRAINT "LearningAchievement_skillAreaId_fkey" FOREIGN KEY ("skillAreaId") REFERENCES "SkillArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_learningAchievementId_fkey" FOREIGN KEY ("learningAchievementId") REFERENCES "LearningAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_recordedByTeacherId_fkey" FOREIGN KEY ("recordedByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
