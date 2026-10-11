-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "level" TEXT NOT NULL DEFAULT 'Sedang',
    "quizStyle" TEXT NOT NULL DEFAULT 'Campuran',
    "quickChoiceAfterMaterial" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderTime" TEXT NOT NULL DEFAULT '16:00',

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
