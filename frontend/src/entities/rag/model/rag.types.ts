export interface RagSource {
  id: string;
  title: string;
  sourceType: string;
  sourceId: string;
  score: number;
}

export interface RagQueryResponse {
  answer: string;
  sources: RagSource[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
}
