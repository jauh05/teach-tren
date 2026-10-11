-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('PG', 'CERITA', 'ISIAN', 'ESAI');

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "subject" TEXT NOT NULL DEFAULT 'Umum';

-- CreateTable
CREATE TABLE "Stimulus" (
    "id" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stimulus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankQuestion" (
    "id" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "stimulusId" TEXT,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "answer" TEXT,
    "acceptedAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rubric" JSONB,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankSeen" (
    "userId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,

    CONSTRAINT "BankSeen_pkey" PRIMARY KEY ("userId","bankId")
);

-- CreateTable
CREATE TABLE "QuizRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "topicId" TEXT,
    "topicName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "retry" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'BERJALAN',
    "percent" INTEGER,
    "stimuli" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "QuizRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizItem" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "stimulusId" TEXT,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "answer" TEXT,
    "acceptedAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rubric" JSONB,
    "explanation" TEXT NOT NULL,
    "bankId" TEXT,
    "userAnswer" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "lowConfidence" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Stimulus_topicKey_level_idx" ON "Stimulus"("topicKey", "level");

-- CreateIndex
CREATE INDEX "BankQuestion_topicKey_level_type_idx" ON "BankQuestion"("topicKey", "level", "type");

-- CreateIndex
CREATE INDEX "QuizRun_userId_createdAt_idx" ON "QuizRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuizRun_guestId_idx" ON "QuizRun"("guestId");

-- CreateIndex
CREATE INDEX "QuizItem_quizId_position_idx" ON "QuizItem"("quizId", "position");

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_stimulusId_fkey" FOREIGN KEY ("stimulusId") REFERENCES "Stimulus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankSeen" ADD CONSTRAINT "BankSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankSeen" ADD CONSTRAINT "BankSeen_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizItem" ADD CONSTRAINT "QuizItem_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "QuizRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
