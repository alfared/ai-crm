export type AiMessageRole = "USER" | "ASSISTANT";

export type AiSource = {
  index: number;
  documentId: string;
  title: string;
  sourceType: string;
  sourceId: string | null;
  companyId: string | null;
  contactId: string | null;
  leadId: string | null;
  chunkIndex: number;
  score: number;
};

export type AiMessage = {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  sources: AiSource[] | null;
  createdAt: string;
};

export type AiConversationListItem = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
};

export type AiConversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AiMessage[];
};

export type SendMessageResponse = {
  userMessage: AiMessage;
  assistantMessage: AiMessage;
};
