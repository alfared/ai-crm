export type Company = {
  id: string;
  workspaceId: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompaniesResponse = {
  items: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
