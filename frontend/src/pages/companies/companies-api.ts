import { apiClient } from "../../shared/api/api-client";
import type { CompaniesResponse } from "./company-types";

type GetCompaniesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getCompanies(
  params: GetCompaniesParams = {},
): Promise<CompaniesResponse> {
  const response = await apiClient.get<CompaniesResponse>("/companies", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return response.data;
}
