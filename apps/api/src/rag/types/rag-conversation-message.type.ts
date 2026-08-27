export type RagConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type RagConversationContext = {
  summary: string | null;
  recentMessages: RagConversationMessage[];
};
