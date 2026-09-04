import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type { RagConversationContext } from './types/rag-conversation-message.type';

@Injectable()
export class QueryRewriteService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });

    this.model = this.configService.get<string>(
      'OPENAI_CHAT_MODEL',
      'gpt-5-mini',
    );
  }

  async rewrite(
    question: string,
    context: RagConversationContext,
  ): Promise<string> {
    if (!context.summary && context.recentMessages.length === 0) {
      return question;
    }

    const historyText = context.recentMessages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n\n');

    const response = await this.client.responses.create({
      model: this.model,

      instructions: `
Rewrite the latest CRM question into a standalone search query.

Use the conversation summary and recent messages only to resolve context and references.

Examples:
"Who is their main contact?"
→ "Who is the main contact at Bright Labs?"

"What is its budget?"
→ "What is the budget of the Bright Labs lead?"

Rules:
- Do not answer the question.
- Do not invent facts.
- Preserve entity names.
- Preserve numbers and business terminology.
- Return only the standalone question.
      `.trim(),

      input: `
CONVERSATION SUMMARY:

${context.summary ?? 'None'}

RECENT CONVERSATION:

${historyText || 'None'}

LATEST QUESTION:

${question}
      `.trim(),
    });

    return response.output_text.trim() || question;
  }
}
