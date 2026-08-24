import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingsService } from './embeddings.service';

@Injectable()
export class CrmKnowledgeIndexerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async backfillWorkspace(workspaceId: string): Promise<{
    companies: number;
    contacts: number;
    leads: number;
  }> {
    const companies = await this.prisma.company.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    const contacts = await this.prisma.contact.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    for (const company of companies) {
      await this.indexCompany(workspaceId, company.id);
    }

    for (const contact of contacts) {
      await this.indexContact(workspaceId, contact.id);
    }

    for (const lead of leads) {
      await this.indexLead(workspaceId, lead.id);
    }

    return {
      companies: companies.length,
      contacts: contacts.length,
      leads: leads.length,
    };
  }

  async indexCompany(workspaceId: string, companyId: string): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        workspaceId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const content = this.buildCompanyContent(company);

    const document = await this.prisma.knowledgeDocument.upsert({
      where: {
        workspaceId_sourceType_sourceId: {
          workspaceId,
          sourceType: 'COMPANY',
          sourceId: company.id,
        },
      },
      update: {
        title: `Company: ${company.name}`,
        companyId: company.id,
        content,
        status: 'INDEXING',
        error: null,
      },
      create: {
        workspaceId,
        title: `Company: ${company.name}`,
        sourceType: 'COMPANY',
        sourceId: company.id,
        companyId: company.id,
        content,
        status: 'INDEXING',
      },
    });

    try {
      await this.reindexDocument(workspaceId, document.id, content, {
        entityType: 'COMPANY',
        companyId: company.id,
      });
    } catch (error) {
      await this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'FAILED',
          error:
            error instanceof Error ? error.message : 'Company indexing failed',
        },
      });
      throw error;
    }
  }

  async indexContact(workspaceId: string, contactId: string): Promise<void> {
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
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const content = this.buildContactContent(contact);

    const document = await this.prisma.knowledgeDocument.upsert({
      where: {
        workspaceId_sourceType_sourceId: {
          workspaceId,
          sourceType: 'CONTACT',
          sourceId: contact.id,
        },
      },
      update: {
        title: `Contact: ${contact.firstName} ${contact.lastName}`,
        contactId: contact.id,
        companyId: contact.companyId,
        content,
        status: 'INDEXING',
        error: null,
      },
      create: {
        workspaceId,
        title: `Contact: ${contact.firstName} ${contact.lastName}`,
        sourceType: 'CONTACT',
        sourceId: contact.id,
        contactId: contact.id,
        companyId: contact.companyId,
        content,
        status: 'INDEXING',
      },
    });

    try {
      await this.reindexDocument(workspaceId, document.id, content, {
        entityType: 'CONTACT',
        contactId: contact.id,
        companyId: contact.companyId,
      });

      await this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'READY',
          error: null,
        },
      });
    } catch (error) {
      await this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'FAILED',
          error:
            error instanceof Error ? error.message : 'Contact indexing failed',
        },
      });
    }
  }

  async indexLead(workspaceId: string, leadId: string): Promise<void> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId,
      },
      include: {
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
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const content = this.buildLeadContent(lead);

    const document = await this.prisma.knowledgeDocument.upsert({
      where: {
        workspaceId_sourceType_sourceId: {
          workspaceId,
          sourceType: 'LEAD',
          sourceId: lead.id,
        },
      },
      update: {
        title: `Lead: ${lead.firstName} ${lead.lastName}`,
        leadId: lead.id,
        companyId: lead.companyId,
        contactId: lead.contactId,
        content,
        status: 'INDEXING',
        error: null,
      },
      create: {
        workspaceId,
        title: `Lead: ${lead.firstName} ${lead.lastName}`,
        sourceType: 'LEAD',
        sourceId: lead.id,
        leadId: lead.id,
        companyId: lead.companyId,
        contactId: lead.contactId,
        content,
        status: 'INDEXING',
      },
    });

    try {
      await this.reindexDocument(workspaceId, document.id, content, {
        entityType: 'LEAD',
        leadId: lead.id,
        ...(lead.companyId ? { companyId: lead.companyId } : {}),
        ...(lead.contactId ? { contactId: lead.contactId } : {}),
      });

      await this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'READY',
          error: null,
        },
      });
    } catch (error) {
      await this.prisma.knowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          status: 'FAILED',
          error:
            error instanceof Error ? error.message : 'Lead indexing failed',
        },
      });
      throw error;
    }
  }

  async removeCompany(workspaceId: string, companyId: string): Promise<void> {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        workspaceId,
        sourceType: 'COMPANY',
        sourceId: companyId,
      },
    });

    if (!document) {
      return;
    }

    await this.prisma.knowledgeChunk.delete({
      where: {
        id: document.id,
      },
    });
  }

  async removeContact(workspaceId: string, contactId: string): Promise<void> {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        workspaceId,
        sourceType: 'CONTACT',
        sourceId: contactId,
      },
    });

    if (!document) {
      return;
    }

    await this.prisma.knowledgeDocument.delete({
      where: {
        id: document.id,
      },
    });
  }

  async removeLead(workspaceId: string, leadId: string): Promise<void> {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        workspaceId,
        sourceType: 'LEAD',
        sourceId: leadId,
      },
    });

    if (!document) {
      return;
    }

    await this.prisma.knowledgeDocument.delete({
      where: {
        id: document.id,
      },
    });
  }

  private async reindexDocument(
    workspaceId: string,
    documentId: string,
    content: string,
    metadata: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({
      where: {
        documentId,
      },
    });

    const chunks = this.chunkingService.chunk(content);

    if (chunks.length === 0) {
      return;
    }

    const embeddings = await this.embeddingsService.embedMany(chunks);

    for (let index = 0; index < chunks.length; index++) {
      const chunk = await this.prisma.knowledgeChunk.create({
        data: {
          workspaceId,
          documentId,
          content: chunks[index],
          chunkIndex: index,
          metadata,
        },
      });

      const vector = `[${embeddings[index].join(',')}]`;

      await this.prisma.$executeRaw(
        Prisma.sql`
        UPDATE "KnowledgeChunk"
        SET "embedding" = ${vector}::vector
        WHERE "id" = ${chunk.id}
      `,
      );
    }
  }

  private buildCompanyContent(company: {
    name: string;
    website: string | null;
    industry: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  }): string {
    return [
      `Company: ${company.name}`,
      company.industry ? `Industry: ${company.industry}` : null,
      company.website ? `Website: ${company.website}` : null,
      company.phone ? `Phone: ${company.phone}` : null,
      company.email ? `Email: ${company.email}` : null,
      company.address ? `Address: ${company.address}` : null,
      company.notes ? `Notes: ${company.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private buildContactContent(contact: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    notes: string | null;
    companyId: string | null;
    company: {
      id: string;
      name: string;
    } | null;
  }): string {
    return [
      `Contact: ${contact.firstName} ${contact.lastName}`,

      contact.company ? `Company: ${contact.company.name}` : null,

      contact.jobTitle ? `Job title: ${contact.jobTitle}` : null,

      contact.email ? `Email: ${contact.email}` : null,

      contact.phone ? `Phone: ${contact.phone}` : null,

      contact.notes ? `Notes:\n${contact.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private buildLeadContent(lead: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    jobTitle: string | null;
    status: string;
    source: string;
    estimatedValue: unknown;
    currency: string | null;
    notes: string | null;
    company: {
      id: string;
      name: string;
    } | null;
    contact: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
    assignedTo: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }): string {
    return [
      `Lead: ${lead.firstName} ${lead.lastName}`,
      lead.company
        ? `Company: ${lead.company.name}`
        : lead.companyName
          ? `Company: ${lead.companyName}`
          : null,

      lead.contact
        ? `Contact: ${lead.contact.firstName} ${lead.contact.lastName}`
        : null,

      lead.jobTitle ? `Job title: ${lead.jobTitle}` : null,

      lead.email ? `Email: ${lead.email}` : null,

      lead.phone ? `Phone: ${lead.phone}` : null,

      `Status: ${lead.status}`,

      `Source: ${lead.source}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}
