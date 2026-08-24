import { apiClient } from "../../../shared/api/api-client";
import type { RagQueryResponse } from "../model/rag.types";

export async function queryRag(question: string): Promise<RagQueryResponse> {
  const response = await apiClient.post<RagQueryResponse>("/rag/query", {
    question,
    limit: 8,
  });

  return response.data;
}
