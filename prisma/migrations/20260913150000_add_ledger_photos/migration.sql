-- CreateTable
CREATE TABLE "LedgerPhoto" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "curriculumUnitId" TEXT NOT NULL,
    "imageData" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedByTeacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerPhoto_studentId_idx" ON "LedgerPhoto"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerPhoto_studentId_curriculumUnitId_key" ON "LedgerPhoto"("studentId", "curriculumUnitId");

-- AddForeignKey
ALTER TABLE "LedgerPhoto" ADD CONSTRAINT "LedgerPhoto_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerPhoto" ADD CONSTRAINT "LedgerPhoto_curriculumUnitId_fkey" FOREIGN KEY ("curriculumUnitId") REFERENCES "CurriculumUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerPhoto" ADD CONSTRAINT "LedgerPhoto_uploadedByTeacherId_fkey" FOREIGN KEY ("uploadedByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
