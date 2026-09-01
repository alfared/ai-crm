import { Injectable, NotFoundException } from '@nestjs/common';

import { AiMessageRole, Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { ConversationSummaryService } from './conversation-summary.service';

@Injectable()
export class AiConversationsService {
  private readonly recentMessagesLimit = 12;
  private readonly summaryTrigger = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly conversationSummaryService: ConversationSummaryService,
  ) {}

  async create(workspaceId: string, userId: string, title?: string) {
    return this.prisma.aiConversation.create({
      data: {
        workspaceId,
        userId,
        title: title?.trim() || null,
      },
    });
  }

  async findAll(workspaceId: string, userId: string) {
    return this.prisma.aiConversation.findMany({
      where: {
        workspaceId,
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  async findOne(workspaceId: string, userId: string, conversationId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async remove(
    workspaceId: string,
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.aiConversation.delete({
      where: {
        id: conversation.id,
      },
    });
  }

  async sendMessage(
    workspaceId: string,
    userId: string,
    conversationId: string,
    content: string,
  ) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const question = content.trim();

    const context = await this.buildConversationContext(conversationId);

    const userMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.USER,
        content: question,
      },
    });

    if (!conversation.title) {
      await this.prisma.aiConversation.update({
        where: {
          id: conversationId,
        },
        data: {
          title: this.createTitle(question),
        },
      });
    }

    const ragResult = await this.ragService.query(
      workspaceId,
      question,
      8,
      context,
    );

    const sources =
      ragResult.sources.length > 0
        ? (ragResult.sources as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.ASSISTANT,
        content: ragResult.answer,
        sources,
      },
    });

    await this.prisma.aiConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await this.refreshSummaryIfNeeded(conversationId);

    return {
      userMessage,
      assistantMessage,
    };
  }

  async updateTitle(
    workspaceId: string,
    userId: string,
    conversationId: string,
    title: string,
  ) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.aiConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        title: title.trim(),
      },
    });
  }

  async prepareMessageStream(
    workspaceId: string,
    userId: string,
    conversationId: string,
    content: string,
  ) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const question = content.trim();

    const context = await this.buildConversationContext(conversationId);

    const userMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.USER,
        content: question,
      },
    });

    if (!conversation.title) {
      await this.prisma.aiConversation.update({
        where: {
          id: conversationId,
        },
        data: {
          title: this.createTitle(question),
        },
      });
    }

    const ragResult = await this.ragService.queryStream(
      workspaceId,
      question,
      8,
      context,
    );

    return {
      conversation,
      userMessage,
      stream: ragResult.stream,
      sources: ragResult.sources,
    };
  }

  async saveAssistantStreamResult(
    conversationId: string,
    answer: string,
    sources: Prisma.InputJsonValue | null,
  ) {
    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.ASSISTANT,
        content: answer,
        sources: sources ?? Prisma.JsonNull,
      },
    });

    await this.prisma.aiConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await this.refreshSummaryIfNeeded(conversationId);

    return assistantMessage;
  }

  private createTitle(question: string): string {
    const normalized = question.replace(/\s+/g, ' ').trim();

    if (normalized.length <= 80) {
      return normalized;
    }

    return `${normalized.slice(0, 77)}...`;
  }

  private async buildConversationContext(conversationId: string): Promise<{
    summary: string | null;
    recentMessages: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  }> {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        summary: true,
      },
    });

    const messages = await this.prisma.aIMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: this.recentMessagesLimit,
    });

    return {
      summary: conversation?.summary ?? null,

      recentMessages: messages.reverse().map((message) => ({
        role:
          message.role === 'USER' ? ('user' as const) : ('assistant' as const),

        content: message.content,
      })),
    };
  }

  private async refreshSummaryIfNeeded(conversationId: string): Promise<void> {
    const messageCount = await this.prisma.aIMessage.count({
      where: {
        conversationId,
      },
    });

    if (messageCount < this.summaryTrigger) {
      return;
    }

    const conversation = await this.prisma.aiConversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        summary: true,
      },
    });

    const messagesToSummarize = await this.prisma.aIMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: messageCount - this.recentMessagesLimit,
    });

    if (messagesToSummarize.length === 0) {
      return;
    }

    const summary = await this.conversationSummaryService.summarize(
      conversation?.summary ?? null,
      messagesToSummarize.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    );

    await this.prisma.aiConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        summary,
        updatedAt: new Date(),
      },
    });
  }
}
