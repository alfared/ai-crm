import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

import { AiConversationsService } from './ai-conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@ApiTags('AI Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai/conversations')
export class AiConversationsController {
  constructor(
    private readonly aiConversationsService: AiConversationsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.aiConversationsService.create(
      user.workspaceId,
      user.userId,
      dto.title,
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.aiConversationsService.findAll(user.workspaceId, user.userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiConversationsService.findOne(
      user.workspaceId,
      user.userId,
      id,
    );
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiConversationsService.sendMessage(
      user.workspaceId,
      user.userId,
      id,
      dto.content,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.aiConversationsService.remove(user.workspaceId, user.userId, id);
  }

  @Patch(':id')
  updateTitle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.aiConversationsService.updateTitle(
      user.workspaceId,
      user.userId,
      id,
      dto.title,
    );
  }

  @Post(':id/messages/stream')
  async sendMessageStream(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @Res() response: Response,
  ): Promise<void> {
    response.status(200);

    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');

    response.flushHeaders();

    let clientDisconnected = false;

    response.on('close', () => {
      clientDisconnected = true;
    });

    try {
      const result = await this.aiConversationsService.prepareMessageStream(
        user.workspaceId,
        user.userId,
        id,
        dto.content,
      );

      if (!clientDisconnected && !response.writableEnded) {
        response.write(
          `event: sources\ndata: ${JSON.stringify(result.sources)}\n\n`,
        );
      }

      let fullAnswer = '';

      for await (const delta of result.stream) {
        if (
          clientDisconnected ||
          response.writableEnded ||
          response.destroyed
        ) {
          break;
        }

        fullAnswer += delta;

        response.write(
          `event: delta\ndata: ${JSON.stringify({
            content: delta,
          })}\n\n`,
        );
      }

      if (clientDisconnected || response.writableEnded || response.destroyed) {
        return;
      }

      const sources: Prisma.InputJsonValue | null =
        result.sources.length > 0
          ? (result.sources as Prisma.InputJsonValue)
          : null;

      const assistantMessage =
        await this.aiConversationsService.saveAssistantStreamResult(
          id,
          fullAnswer,
          sources,
        );

      if (!response.writableEnded) {
        response.write(
          `event: done\ndata: ${JSON.stringify({
            message: assistantMessage,
          })}\n\n`,
        );
      }
    } catch (error) {
      console.error('AI conversation streaming error:', error);

      if (
        !clientDisconnected &&
        !response.writableEnded &&
        !response.destroyed
      ) {
        response.write(
          `event: error\ndata: ${JSON.stringify({
            message: 'Failed to generate AI response',
          })}\n\n`,
        );
      }
    } finally {
      if (!response.writableEnded && !response.destroyed) {
        response.end();
      }
    }
  }
}
