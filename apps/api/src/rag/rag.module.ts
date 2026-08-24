import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChunkingService } from './chunking.service';
import { EmbeddingsService } from './embeddings.service';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RetrievalService } from './retrieval.service';
import { GenerationService } from './generation.service';
import { CrmKnowledgeIndexerService } from './crm-knowledge-indexer.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RagController],
  providers: [
    RagService,
    ChunkingService,
    EmbeddingsService,
    RetrievalService,
    GenerationService,
    CrmKnowledgeIndexerService,
  ],
  exports: [RagService, CrmKnowledgeIndexerService],
})
export class RagModule {}
