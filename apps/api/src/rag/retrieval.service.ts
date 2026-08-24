import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';

type RetrievedChunk = {
  id: string;
  documentId: string;

  content: string;
  chunkIndex: number;

  title: string;

  sourceType: string;
  sourceId: string | null;

  companyId: string | null;
  contactId: string | null;
  leadId: string | null;

  score: number;
};

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async search(
    workspaceId: string,
    question: string,
    limit = 6,
  ): Promise<RetrievedChunk[]> {
    const embedding = await this.embeddingsService.embed(question);

    const vector = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRaw<RetrievedChunk[]>(
      Prisma.sql`
      SELECT
        c."id",
        c."documentId",
        c."content",
        c."chunkIndex",
        d."title",
        d."sourceType",
        d."sourceId",
        d."companyId",
        d."contactId",
        d."leadId",
        1 - (
          c."embedding" <=> ${vector}::vector
        ) AS score
      FROM "KnowledgeChunk" c
      INNER JOIN "KnowledgeDocument" d
        ON d."id" = c."documentId"
      WHERE
        c."workspaceId" = ${workspaceId}
        AND d."workspaceId" = ${workspaceId}
        AND c."embedding" IS NOT NULL
        AND d."status" = 'READY'
      ORDER BY
        c."embedding" <=> ${vector}::vector
      LIMIT ${limit}
    `,
    );

    console.log(
      'RAG retrieval:',
      results.map((item) => ({
        title: item.title,
        score: Number(item.score),
      })),
    );

    return results;
  }
}
