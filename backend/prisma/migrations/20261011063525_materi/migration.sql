-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PDF', 'DOCX', 'PPTX');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('MENGUNGGAH', 'MEMPROSES', 'SIAP', 'GAGAL');

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "MaterialStatus" NOT NULL,
    "summary" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error" TEXT,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_userId_createdAt_idx" ON "Material"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Material_userId_topicId_idx" ON "Material"("userId", "topicId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
