import { Module } from '@nestjs/common';
import { AiConversationsController } from './ai-conversations.controller';
import { AiConversationsService } from './ai-conversations.service';

@Module({
  controllers: [AiConversationsController],
  providers: [AiConversationsService]
})
export class AiConversationsModule {}
