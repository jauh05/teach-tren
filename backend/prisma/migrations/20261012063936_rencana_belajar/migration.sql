-- CreateTable
CREATE TABLE "LearningPlan" (
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
