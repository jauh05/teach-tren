-- CreateEnum
CREATE TYPE "ScheduleKind" AS ENUM ('LATIHAN', 'ULANG', 'BARU', 'SARAN', 'ISTIRAHAT');

-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ScheduleKind" NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRun" (
    "userId" TEXT NOT NULL,
    "runDate" TEXT NOT NULL,
    "memoryHash" TEXT NOT NULL,

    CONSTRAINT "ScheduleRun_pkey" PRIMARY KEY ("userId","runDate")
);

-- CreateIndex
CREATE INDEX "ScheduleItem_userId_date_idx" ON "ScheduleItem"("userId", "date");

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRun" ADD CONSTRAINT "ScheduleRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
