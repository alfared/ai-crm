import { apiClient } from "../../../shared/api/api-client";

import type {
  AiConversation,
  AiConversationListItem,
  AiMessage,
  AiSource,
} from "../model/ai-conversation.types";
import { tokenStorage } from "../../../shared/lib/auth/token-storage";

type StreamCallbacks = {
  onUserMessage?: (message: AiMessage) => void;
  onSources?: (sources: AiSource[]) => void;
  onDelta?: (delta: string) => void;
  onDone?: (message: AiMessage) => void;
};

export async function getAiConversations(): Promise<AiConversationListItem[]> {
  const response =
    await apiClient.get<AiConversationListItem[]>("/ai/conversations");

  return response.data;
}

export async function getAiConversation(id: string): Promise<AiConversation> {
  const response = await apiClient.get<AiConversation>(
    `/ai/conversations/${id}`,
  );

  return response.data;
}

export async function createAiConversation(): Promise<AiConversationListItem> {
  const response = await apiClient.post<AiConversationListItem>(
    "/ai/conversations",
    {},
  );

  return response.data;
}

export async function deleteAiConversation(id: string): Promise<void> {
  await apiClient.delete(`/ai/conversations/${id}`);
}

export async function renameAiConversation(
  id: string,
  title: string,
): Promise<AiConversationListItem> {
  const response = await apiClient.patch<AiConversationListItem>(
    `/ai/conversations/${id}`,
    { title },
  );

  return response.data;
}

export async function streamAiMessage(
  conversationId: string,
  content: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const token = tokenStorage.get();

  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/ai/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    throw new Error(`Streaming failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is missing");
  }

  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n");

      const eventLine = lines.find((line) => line.startsWith("event:"));

      const dataLine = lines.find((line) => line.startsWith("data:"));

      if (!eventLine || !dataLine) {
        continue;
      }

      const eventName = eventLine.slice(6).trim();

      const data = JSON.parse(dataLine.slice(5).trim());

      switch (eventName) {
        case "message":
          callbacks.onUserMessage?.(data);
          break;
        case "sources":
          callbacks.onSources?.(data);
          break;
        case "delta":
          callbacks.onDelta?.(data.content);
          break;

        case "done":
          callbacks.onDone?.(data.message);
          break;

        case "error":
          throw new Error(data.message ?? "Streaming error");
      }
    }
  }
}
