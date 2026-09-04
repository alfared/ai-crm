import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CrmKnowledgeIndexerService } from './crm-knowledge-indexer.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateKnowledgeDocumentDto } from './dto/create-knowledge-document.dto';
import { QueryRagDto } from './dto/query-rag.dto';
import { RagService } from './rag.service';

@ApiTags('RAG')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly crmKnowledgeIndexer: CrmKnowledgeIndexerService,
  ) {}

  @Post('documents')
  createDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateKnowledgeDocumentDto,
  ) {
    return this.ragService.createDocument(user.workspaceId, dto);
  }

  @Post('documents/:id/index')
  indexDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ragService.indexDocument(user.workspaceId, id);
  }

  @Post('search')
  search(@CurrentUser() user: AuthenticatedUser, @Body() dto: QueryRagDto) {
    return this.ragService.search(user.workspaceId, dto.question, dto.limit);
  }

  @Post('query')
  query(@CurrentUser() user: AuthenticatedUser, @Body() dto: QueryRagDto) {
    return this.ragService.query(user.workspaceId, dto.question, dto.limit);
  }

  @Post('backfill')
  backfill(@CurrentUser() user: AuthenticatedUser) {
    return this.crmKnowledgeIndexer.backfillWorkspace(user.workspaceId);
  }
}
