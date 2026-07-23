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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a contact',
  })
  @ApiCreatedResponse({
    description: 'Contact created',
  })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(currentUser.workspaceId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List contacts',
  })
  @ApiOkResponse({
    description: 'Paginated list of contacts',
  })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListContactsQueryDto,
  ) {
    return this.contactsService.findAll(currentUser.workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get contact by ID',
  })
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.findOne(currentUser.workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a contact',
  })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(currentUser.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a contact',
  })
  @ApiNoContentResponse({
    description: 'Contact deleted',
  })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.contactsService.remove(currentUser.workspaceId, id);
  }
}
