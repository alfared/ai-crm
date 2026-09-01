import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RagModule } from '../rag/rag.module';

import { AiConversationsController } from './ai-conversations.controller';
import { AiConversationsService } from './ai-conversations.service';
import { ConversationSummaryService } from './conversation-summary.service';

@Module({
  imports: [PrismaModule, RagModule, AuthModule],
  controllers: [AiConversationsController],
  providers: [AiConversationsService, ConversationSummaryService],
  exports: [AiConversationsService],
})
export class AiConversationsModule {}
