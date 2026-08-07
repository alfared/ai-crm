export type ContactCompany = {
  id: string;
  name: string;
};

export type Contact = {
  id: string;
  workspaceId: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  company: ContactCompany | null;
};

export type ContactsResponse = {
  items: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type GetContactsParams = {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
};
