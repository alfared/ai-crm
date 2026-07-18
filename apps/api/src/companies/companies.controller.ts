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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiCreatedResponse({
    description: 'The company has been successfully created.',
  })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(currentUser.workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of companies' })
  @ApiOkResponse({
    description: 'The list of companies has been successfully retrieved.',
  })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListCompaniesQueryDto,
  ) {
    return this.companiesService.findAll(currentUser.workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific company' })
  @ApiOkResponse({
    description: 'The company has been successfully retrieved.',
  })
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.findOne(currentUser.workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific company' })
  @ApiOkResponse({
    description: 'The company has been successfully updated.',
  })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(currentUser.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific company' })
  @ApiNoContentResponse({
    description: 'The company has been successfully deleted.',
  })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.remove(currentUser.workspaceId, id);
  }
}
