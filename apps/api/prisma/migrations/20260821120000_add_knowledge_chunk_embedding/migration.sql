CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeChunk"
ADD COLUMN "embedding" vector(1536);
