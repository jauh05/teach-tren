-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "GuestUsage" (
    "guestId" TEXT NOT NULL,
    "actions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestUsage_pkey" PRIMARY KEY ("guestId")
);
