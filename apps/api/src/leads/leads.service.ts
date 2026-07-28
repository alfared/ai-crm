import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateLeadDto) {
    await this.validateRelations(workspaceId, dto);

    return this.prisma.lead.create({
      data: {
        workspaceId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: this.normalizeEmail(dto.email),
        phone: this.normalizeOptionalString(dto.phone),
        companyName: this.normalizeOptionalString(dto.companyName),
        status: dto.status ?? LeadStatus.NEW,
        source: dto.source,
        estimatedValue: dto.estimatedValue,
        currency: dto.currency?.trim().toUpperCase() || 'EUR',
        notes: this.normalizeOptionalString(dto.notes),
        companyId: dto.companyId,
        contactId: dto.contactId,
        assignedToId: dto.assignedToId,
        ...this.getStatusTimestamps(dto.status ?? LeadStatus.NEW),
      },
      include: this.getLeadRelations(),
    });
  }

  async findAll(workspaceId: string, query: ListLeadsQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      workspaceId,
      ...(query.status && { status: query.status }),
      ...(query.source && { source: query.source }),
      ...(query.companyId && { companyId: query.companyId }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
    };

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
          companyName: {
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
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: this.getLeadRelations(),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.lead.count({
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

  async findOne(workspaceId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId,
      },
      include: this.getLeadRelations(),
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    return lead;
  }

  private async validateRelations(
    workspaceId: string,
    dto: {
      companyId?: string;
      contactId?: string;
      assignedToId?: string;
    },
  ): Promise<void> {
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: dto.companyId,
          workspaceId,
        },
        select: { id: true },
      });

      if (!company) {
        throw new BadRequestException(
          `Company with ID ${dto.companyId} does not exist in the workspace.`,
        );
      }

      if (dto.contactId && !dto.companyId) {
        const contact = await this.prisma.contact.findFirst({
          where: {
            id: dto.contactId,
            companyId: dto.companyId,
            workspaceId,
          },
          select: { id: true, companyId: true },
        });

        if (!contact) {
          throw new BadRequestException(
            `Contact with ID ${dto.contactId} does not exist in the workspace.`,
          );
        }
      }
    }

    if (dto.assignedToId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: dto.assignedToId,
          workspaceId,
        },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException(
          `User with ID ${dto.assignedToId} does not exist in the workspace.`,
        );
      }
    }
  }

  async update(workspaceId: string, leadId: string, dto: UpdateLeadDto) {
    const existingLead = await this.findOne(workspaceId, leadId);

    await this.validateRelations(workspaceId, dto);

    const statusChanged = dto.status && dto.status !== existingLead.status;

    return this.prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.email !== undefined && {
          email: this.normalizeEmail(dto.email),
        }),
        ...(dto.phone !== undefined && {
          phone: this.normalizeOptionalString(dto.phone),
        }),
        ...(dto.companyName !== undefined && {
          companyName: this.normalizeOptionalString(dto.companyName),
        }),
        ...(dto.jobTitle !== undefined && {
          jobTitle: this.normalizeOptionalString(dto.jobTitle),
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.estimatedValue !== undefined && {
          estimatedValue: dto.estimatedValue,
        }),
        ...(dto.currency !== undefined && {
          currency: dto.currency?.trim().toUpperCase(),
        }),
        ...(dto.notes !== undefined && {
          notes: this.normalizeOptionalString(dto.notes),
        }),
        ...(dto.companyId !== undefined && { companyId: dto.companyId }),
        ...(dto.contactId !== undefined && { contactId: dto.contactId }),
        ...(dto.assignedToId !== undefined && {
          assignedToId: dto.assignedToId,
        }),
        ...(statusChanged &&
          dto.status &&
          this.getStatusTimestamps(dto.status)),
      },
      include: this.getLeadRelations(),
    });
  }

  async updateStatus(workspaceId: string, leadId: string, status: LeadStatus) {
    const lead = await this.findOne(workspaceId, leadId);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Converted lead status cannot be changed');
    }

    return this.prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        status,
        ...this.getStatusTimestamps(status),
      },
      include: this.getLeadRelations(),
    });
  }

  async remove(workspaceId: string, leadId: string): Promise<void> {
    const lead = await this.findOne(workspaceId, leadId);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Converted lead cannot be deleted');
    }

    await this.prisma.lead.delete({
      where: {
        id: leadId,
      },
    });
  }

  private getStatusTimestamps(status: LeadStatus) {
    const now = new Date();

    switch (status) {
      case LeadStatus.CONTACTED:
        return {
          contractedAt: now,
        };

      case LeadStatus.QUALIFIED:
        return {
          qualifiedAt: now,
        };

      case LeadStatus.CONVERTED:
        return {
          convertedAt: now,
        };
      case LeadStatus.LOST:
        return {
          lostAt: now,
        };
      default:
        return {};
    }
  }

  private getLeadRelations() {
    return {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    } satisfies Prisma.LeadInclude;
  }

  private normalizeEmail(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value?.trim().toLowerCase();
    return normalized || undefined;
  }

  private normalizeOptionalString(
    value: string | undefined,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value?.trim();
    return normalized || undefined;
  }
}
