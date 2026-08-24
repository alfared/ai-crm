/*
  Warnings:

  - You are about to drop the column `embedding` on the `KnowledgeChunk` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workspaceId,sourceType,sourceId]` on the table `KnowledgeDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "KnowledgeDocument_sourceId_idx";

-- AlterTable
ALTER TABLE "KnowledgeChunk" DROP COLUMN "embedding";

-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "leadId" TEXT;

-- CreateIndex
CREATE INDEX "KnowledgeDocument_companyId_idx" ON "KnowledgeDocument"("companyId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_contactId_idx" ON "KnowledgeDocument"("contactId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_leadId_idx" ON "KnowledgeDocument"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDocument_workspaceId_sourceType_sourceId_key" ON "KnowledgeDocument"("workspaceId", "sourceType", "sourceId");
