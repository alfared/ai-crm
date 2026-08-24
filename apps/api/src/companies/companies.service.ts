import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CrmKnowledgeIndexerService } from 'src/rag/crm-knowledge-indexer.service';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmKnowledgeIndexerService: CrmKnowledgeIndexerService,
  ) {}

  async create(workspaceId: string, dto: CreateCompanyDto) {
    const company = await this.prisma.company.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        website: this.normalizeOptionalString(dto.website),
        industry: this.normalizeOptionalString(dto.industry),
        phone: this.normalizeOptionalString(dto.phone),
        email: dto.email?.trim().toLowerCase(),
        address: this.normalizeOptionalString(dto.address),
        notes: this.normalizeOptionalString(dto.notes),
      },
    });

    await this.crmKnowledgeIndexerService.indexCompany(workspaceId, company.id);

    return company;
  }

  async findAll(workspaceId: string, query: ListCompaniesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      workspaceId,
    };

    const search = query.search?.trim();

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          industry: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.company.count({
        where,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(workspaceId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        workspaceId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(workspaceId: string, companyId: string, dto: UpdateCompanyDto) {
    await this.findOne(workspaceId, companyId);

    const company = await this.prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),
        ...(dto.website !== undefined && {
          website: this.normalizeOptionalString(dto.website),
        }),
        ...(dto.industry !== undefined && {
          industry: this.normalizeOptionalString(dto.industry),
        }),
        ...(dto.phone !== undefined && {
          phone: this.normalizeOptionalString(dto.phone),
        }),
        ...(dto.email !== undefined && {
          email: dto.email.trim().toLowerCase(),
        }),
        ...(dto.address !== undefined && {
          address: this.normalizeOptionalString(dto.address),
        }),
        ...(dto.notes !== undefined && {
          notes: this.normalizeOptionalString(dto.notes),
        }),
      },
    });

    await this.crmKnowledgeIndexerService.indexCompany(workspaceId, company.id);

    return company;
  }

  async remove(workspaceId: string, companyId: string): Promise<void> {
    await this.findOne(workspaceId, companyId);

    await this.crmKnowledgeIndexerService.removeCompany(workspaceId, companyId);

    await this.prisma.company.delete({
      where: {
        id: companyId,
      },
    });
  }

  private normalizeOptionalString(
    value: string | undefined,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  }
}
