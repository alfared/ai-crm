import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CrmKnowledgeIndexerService } from 'src/rag/crm-knowledge-indexer.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmKnowledgeIndexer: CrmKnowledgeIndexerService,
  ) {}

  async create(workspaceId: string, dto: CreateContactDto) {
    if (dto.companyId) {
      await this.ensureCompanyBelongsToWorkspace(workspaceId, dto.companyId);
    }

    const contact = await this.prisma.contact.create({
      data: {
        workspaceId,
        companyId: dto.companyId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: this.normalizeEmail(dto.email),
        phone: this.normalizeOptionalString(dto.phone),
        jobTitle: this.normalizeOptionalString(dto.jobTitle),
        notes: this.normalizeOptionalString(dto.notes),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.crmKnowledgeIndexer.indexContact(workspaceId, contact.id);

    return contact;
  }

  async findAll(workspaceId: string, query: ListContactsQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      workspaceId,
    };

    if (query.companyId) {
      where.companyId = query.companyId;
    }

    const search = query.search?.trim();

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
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
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          jobTitle: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          company: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            lastName: 'asc',
          },
          {
            firstName: 'asc',
          },
        ],
        skip,
        take: limit,
      }),
      this.prisma.contact.count({
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

  async findOne(workspaceId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(workspaceId: string, contactId: string, dto: UpdateContactDto) {
    await this.findOne(workspaceId, contactId);

    if (dto.companyId) {
      await this.ensureCompanyBelongsToWorkspace(workspaceId, dto.companyId);
    }

    const contact = await this.prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        ...(dto.companyId !== undefined && {
          companyId: dto.companyId,
        }),
        ...(dto.firstName !== undefined && {
          firstName: dto.firstName.trim(),
        }),
        ...(dto.lastName !== undefined && {
          lastName: dto.lastName.trim(),
        }),
        ...(dto.email !== undefined && {
          email: this.normalizeEmail(dto.email),
        }),
        ...(dto.phone !== undefined && {
          phone: this.normalizeOptionalString(dto.phone),
        }),
        ...(dto.jobTitle !== undefined && {
          jobTitle: this.normalizeOptionalString(dto.jobTitle),
        }),
        ...(dto.notes !== undefined && {
          notes: this.normalizeOptionalString(dto.notes),
        }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.crmKnowledgeIndexer.indexContact(workspaceId, contact.id);
    return contact;
  }

  async remove(workspaceId: string, contactId: string): Promise<void> {
    await this.findOne(workspaceId, contactId);

    await this.crmKnowledgeIndexer.removeContact(workspaceId, contactId);
    await this.prisma.contact.delete({
      where: {
        id: contactId,
      },
    });
  }

  private async ensureCompanyBelongsToWorkspace(
    workspaceId: string,
    companyId: string,
  ): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }
  }

  private normalizeEmail(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();

    return normalized.length > 0 ? normalized : undefined;
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
