-- AlterTable
ALTER TABLE "AiConversation"
ADD COLUMN "summary" TEXT,
ADD COLUMN "summaryMessageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "summaryUpdatedAt" TIMESTAMP(3);
