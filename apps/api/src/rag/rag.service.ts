import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChunkingService } from './chunking.service';
import { CreateKnowledgeDocumentDto } from './dto/create-knowledge-document.dto';
import { EmbeddingsService } from './embeddings.service';
import { RetrievalService } from './retrieval.service';
import { GenerationService } from './generation.service';
import { CrmKnowledgeIndexerService } from './crm-knowledge-indexer.service';
import { QueryRewriteService } from './query-rewrite.service';
import type { RagConversationContext } from './types/rag-conversation-message.type';

@Injectable()
export class RagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrievalService: RetrievalService,
    private readonly generationService: GenerationService,
    private readonly queryRewriteService: QueryRewriteService,
    private readonly crmKnowledgeIndexerService: CrmKnowledgeIndexerService,
  ) {}

  async createDocument(workspaceId: string, dto: CreateKnowledgeDocumentDto) {
    return this.prisma.knowledgeDocument.create({
      data: {
        workspaceId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
      },
    });
  }

  async indexDocument(workspaceId: string, documentId: string) {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: documentId,
        workspaceId,
      },
    });

    if (!document) {
      throw new NotFoundException('Knowledge document not found');
    }

    if (!document.content) {
      throw new Error('Knowledge document has no content');
    }

    await this.prisma.knowledgeDocument.update({
      where: {
        id: document.id,
      },
      data: {
        status: 'INDEXING',
        error: null,
      },
    });

    try {
      await this.prisma.knowledgeChunk.deleteMany({
        where: {
          documentId: document.id,
        },
      });

      const chunks = this.chunkingService.chunk(document.content);

      const embeddings = await this.embeddingsService.embedMany(chunks);

      for (let index = 0; index < chunks.length; index++) {
        const chunk = await this.prisma.knowledgeChunk.create({
          data: {
            workspaceId,
            documentId: document.id,
            chunkIndex: index,
            content: chunks[index],
          },
        });

        const vector = `[${embeddings[index].join(',')}]`;

        await this.prisma.$executeRaw(
          Prisma.sql`
            UPDATE "KnowledgeChunk"
            SET "embedding" = ${vector}::vector
            WHERE "id" = ${chunk.id}
          `,
        );
      }

      return this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'READY',
        },
      });
    } catch (error) {
      await this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Indexing failed',
        },
      });

      throw error;
    }
  }

  async search(workspaceId: string, question: string, limit: number) {
    return this.retrievalService.search(workspaceId, question, limit);
  }

  async query(
    workspaceId: string,
    question: string,
    limit: number,
    conversationContext: RagConversationContext = {
      summary: null,
      recentMessages: [],
    },
  ) {
    const standaloneQuestion = await this.queryRewriteService.rewrite(
      question,
      conversationContext,
    );

    const chunks = await this.retrievalService.search(
      workspaceId,
      standaloneQuestion,
      limit,
    );

    if (chunks.length === 0) {
      return {
        answer:
          'I could not find enough information in your CRM to answer this question.',
        sources: [],
      };
    }

    const answer = await this.generationService.generate(
      question,
      chunks.map((chunk, index) => ({
        index: index + 1,
        title: chunk.title,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        content: chunk.content,
      })),
      conversationContext,
    );

    return {
      answer,

      sources: chunks.map((chunk, index) => ({
        index: index + 1,

        documentId: chunk.documentId,

        title: chunk.title,

        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,

        companyId: chunk.companyId,
        contactId: chunk.contactId,
        leadId: chunk.leadId,

        chunkIndex: chunk.chunkIndex,

        score: Number(chunk.score) >= 0.5,
      })),
    };
  }
}
