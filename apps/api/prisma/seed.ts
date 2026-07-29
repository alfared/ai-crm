import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';

import {
  LeadSource,
  LeadStatus,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

const DEMO_WORKSPACE_SLUG = 'demo-workspace';
const DEMO_USER_EMAIL = 'demo@ai-crm.app';
const DEMO_USER_PASSWORD = 'Demo123456!';

async function main(): Promise<void> {
  console.log('Starting database seed...');

  const passwordHash = await argon2.hash(DEMO_USER_PASSWORD);

  const workspace = await prisma.workspace.upsert({
    where: {
      slug: DEMO_WORKSPACE_SLUG,
    },
    update: {
      name: 'AI CRM Demo Workspace',
    },
    create: {
      name: 'AI CRM Demo Workspace',
      slug: DEMO_WORKSPACE_SLUG,
    },
  });

  const owner = await prisma.user.upsert({
    where: {
      email: DEMO_USER_EMAIL,
    },
    update: {
      workspaceId: workspace.id,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Owner',
      role: UserRole.OWNER,
    },
    create: {
      workspaceId: workspace.id,
      email: DEMO_USER_EMAIL,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Owner',
      role: UserRole.OWNER,
    },
  });

  const companiesData = [
    {
      name: 'Bright Labs',
      website: 'https://brightlabs.example',
      industry: 'Software Development',
      phone: '+420 541 100 101',
      email: 'hello@brightlabs.example',
      address: 'Brno, Czech Republic',
      notes: 'Interested in CRM automation and AI lead scoring.',
    },
    {
      name: 'Moravia Construction',
      website: 'https://moravia-construction.example',
      industry: 'Construction',
      phone: '+420 541 200 202',
      email: 'office@moravia-construction.example',
      address: 'Brno, Czech Republic',
      notes: 'Looking for a centralized sales pipeline.',
    },
    {
      name: 'Nova Retail',
      website: 'https://nova-retail.example',
      industry: 'Retail',
      phone: '+420 541 300 303',
      email: 'sales@nova-retail.example',
      address: 'Prague, Czech Republic',
      notes: 'Needs customer and contact management.',
    },
    {
      name: 'Alpine Logistics',
      website: 'https://alpine-logistics.example',
      industry: 'Logistics',
      phone: '+41 44 100 20 30',
      email: 'contact@alpine-logistics.example',
      address: 'Zurich, Switzerland',
      notes: 'Potential international customer.',
    },
    {
      name: 'Green Energy Systems',
      website: 'https://green-energy.example',
      industry: 'Renewable Energy',
      phone: '+420 541 400 404',
      email: 'info@green-energy.example',
      address: 'Ostrava, Czech Republic',
      notes: 'Requested a product demonstration.',
    },
  ];

  const companies = [];

  for (const companyData of companiesData) {
    const existingCompany = await prisma.company.findFirst({
      where: {
        workspaceId: workspace.id,
        name: companyData.name,
      },
    });

    const company = existingCompany
      ? await prisma.company.update({
          where: {
            id: existingCompany.id,
          },
          data: companyData,
        })
      : await prisma.company.create({
          data: {
            ...companyData,
            workspaceId: workspace.id,
          },
        });

    companies.push(company);
  }

  const contactsData = [
    {
      companyName: 'Bright Labs',
      firstName: 'Anna',
      lastName: 'Nováková',
      email: 'anna.novakova@brightlabs.example',
      phone: '+420 601 111 111',
      jobTitle: 'Chief Technology Officer',
      notes: 'Primary technical decision-maker.',
    },
    {
      companyName: 'Bright Labs',
      firstName: 'Martin',
      lastName: 'Svoboda',
      email: 'martin.svoboda@brightlabs.example',
      phone: '+420 602 222 222',
      jobTitle: 'Sales Manager',
      notes: 'Responsible for sales operations.',
    },
    {
      companyName: 'Moravia Construction',
      firstName: 'Petr',
      lastName: 'Dvořák',
      email: 'petr.dvorak@moravia-construction.example',
      phone: '+420 603 333 333',
      jobTitle: 'Managing Director',
      notes: 'Requested an initial consultation.',
    },
    {
      companyName: 'Nova Retail',
      firstName: 'Lucie',
      lastName: 'Procházková',
      email: 'lucie.prochazkova@nova-retail.example',
      phone: '+420 604 444 444',
      jobTitle: 'E-commerce Manager',
      notes: 'Interested in customer segmentation.',
    },
    {
      companyName: 'Alpine Logistics',
      firstName: 'Daniel',
      lastName: 'Müller',
      email: 'daniel.mueller@alpine-logistics.example',
      phone: '+41 79 555 55 55',
      jobTitle: 'Operations Director',
      notes: 'English-speaking contact.',
    },
    {
      companyName: 'Green Energy Systems',
      firstName: 'Eva',
      lastName: 'Králová',
      email: 'eva.kralova@green-energy.example',
      phone: '+420 605 555 555',
      jobTitle: 'Business Development Manager',
      notes: 'Follow up after product demo.',
    },
  ];

  const contacts = [];

  for (const contactData of contactsData) {
    const company = companies.find(
      (item) => item.name === contactData.companyName,
    );

    if (!company) {
      throw new Error(`Company not found: ${contactData.companyName}`);
    }

    const existingContact = await prisma.contact.findFirst({
      where: {
        workspaceId: workspace.id,
        email: contactData.email,
      },
    });

    const { companyName, ...data } = contactData;

    const contact = existingContact
      ? await prisma.contact.update({
          where: {
            id: existingContact.id,
          },
          data: {
            ...data,
            companyId: company.id,
          },
        })
      : await prisma.contact.create({
          data: {
            ...data,
            workspaceId: workspace.id,
            companyId: company.id,
          },
        });

    contacts.push(contact);
  }

  const leadsData = [
    {
      contactEmail: 'anna.novakova@brightlabs.example',
      status: LeadStatus.QUALIFIED,
      source: LeadSource.LINKEDIN,
      estimatedValue: '28000.00',
      currency: 'EUR',
      notes: 'Qualified lead. Technical discovery call completed.',
      contractedAt: new Date('2026-07-10T10:00:00.000Z'),
      qualifiedAt: new Date('2026-07-15T10:00:00.000Z'),
    },
    {
      contactEmail: 'martin.svoboda@brightlabs.example',
      status: LeadStatus.CONTACTED,
      source: LeadSource.EMAIL,
      estimatedValue: '12000.00',
      currency: 'EUR',
      notes: 'Proposal sent by email.',
      contractedAt: new Date('2026-07-18T09:00:00.000Z'),
    },
    {
      contactEmail: 'petr.dvorak@moravia-construction.example',
      status: LeadStatus.NEW,
      source: LeadSource.REFERRAL,
      estimatedValue: '45000.00',
      currency: 'EUR',
      notes: 'Referral from an existing business contact.',
    },
    {
      contactEmail: 'lucie.prochazkova@nova-retail.example',
      status: LeadStatus.CONVERTED,
      source: LeadSource.WEBSITE,
      estimatedValue: '18500.00',
      currency: 'EUR',
      notes: 'Converted after successful CRM demonstration.',
      contractedAt: new Date('2026-06-20T10:00:00.000Z'),
      qualifiedAt: new Date('2026-06-25T10:00:00.000Z'),
      convertedAt: new Date('2026-07-05T10:00:00.000Z'),
    },
    {
      contactEmail: 'daniel.mueller@alpine-logistics.example',
      status: LeadStatus.CONTACTED,
      source: LeadSource.EVENT,
      estimatedValue: '65000.00',
      currency: 'EUR',
      notes: 'Met during a technology conference.',
      contractedAt: new Date('2026-07-21T10:00:00.000Z'),
    },
    {
      contactEmail: 'eva.kralova@green-energy.example',
      status: LeadStatus.LOST,
      source: LeadSource.PHONE,
      estimatedValue: '9000.00',
      currency: 'EUR',
      notes: 'Project postponed because of budget restrictions.',
      contractedAt: new Date('2026-06-12T10:00:00.000Z'),
      lostAt: new Date('2026-07-01T10:00:00.000Z'),
    },
  ];

  for (const leadData of leadsData) {
    const contact = contacts.find(
      (item) => item.email === leadData.contactEmail,
    );

    if (!contact) {
      throw new Error(`Contact not found: ${leadData.contactEmail}`);
    }

    const company = companies.find((item) => item.id === contact.companyId);

    const existingLead = await prisma.lead.findFirst({
      where: {
        workspaceId: workspace.id,
        email: contact.email,
        status: leadData.status,
      },
    });

    const { contactEmail, ...data } = leadData;

    const commonData = {
      ...data,
      workspaceId: workspace.id,
      companyId: company?.id,
      contactId: contact.id,
      assignedToId: owner.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      companyName: company?.name,
      jobTitle: contact.jobTitle,
    };

    if (existingLead) {
      await prisma.lead.update({
        where: {
          id: existingLead.id,
        },
        data: commonData,
      });
    } else {
      await prisma.lead.create({
        data: commonData,
      });
    }
  }

  const companyCount = await prisma.company.count({
    where: {
      workspaceId: workspace.id,
    },
  });

  const contactCount = await prisma.contact.count({
    where: {
      workspaceId: workspace.id,
    },
  });

  const leadCount = await prisma.lead.count({
    where: {
      workspaceId: workspace.id,
    },
  });

  console.log('');
  console.log('Seed completed successfully.');
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Companies: ${companyCount}`);
  console.log(`Contacts: ${contactCount}`);
  console.log(`Leads: ${leadCount}`);
  console.log('');
  console.log('Demo credentials:');
  console.log(`Email: ${DEMO_USER_EMAIL}`);
  console.log(`Password: ${DEMO_USER_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
