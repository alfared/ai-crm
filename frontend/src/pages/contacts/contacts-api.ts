import { apiClient } from "../../shared/api/api-client";
import type { ContactsResponse, GetContactsParams } from "./contact-types";

export async function getContacts(
  params: GetContactsParams = {},
): Promise<ContactsResponse> {
  const response = await apiClient.get<ContactsResponse>("/contacts", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.search ? { search: params.search } : {}),
      ...(params.companyId ? { companyId: params.companyId } : {}),
    },
  });

  return response.data;
}
