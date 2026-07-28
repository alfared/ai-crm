import { apiClient } from "./api-client";

export type HealthResponse = {
  status: string;
  database?: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/health");
  return response.data;
}
