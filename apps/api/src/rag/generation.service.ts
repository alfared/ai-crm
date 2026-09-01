import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { RagConversationContext } from './types/rag-conversation-message.type';
import { RetrievedChunk } from '../rag/retrieval.service';

type RagContext = {
  index: number;
  title: string;
  sourceType: string;
  sourceId: string | null;
  content: string;
};

@Injectable()
export class GenerationService {
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

  async generate(
    question: string,
    context: RagContext[],
    conversationContext: RagConversationContext,
  ): Promise<string> {
    const historyText = conversationContext.recentMessages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n\n');

    const contextText = context
      .map((item) =>
        `
[SOURCE ${item.index}]
Title: ${item.title}
Type: ${item.sourceType}

${item.content}
        `.trim(),
      )
      .join('\n\n');

    const response = await this.client.responses.create({
      model: this.model,

      instructions: `
You are an AI assistant inside a CRM.

Answer questions using only the supplied CRM context.

Rules:
- Do not invent CRM facts.
- If the answer is not present in the context, say that there is not enough information.
- Prefer concise and factual answers.
- Reference sources using [1], [2], etc.
- Never expose information outside the supplied workspace context.
      `.trim(),

      input: `
LONG-TERM CONVERSATION SUMMARY:

${conversationContext.summary ?? 'None'}

RECENT CONVERSATION:

${historyText || 'None'}

RETRIEVED CRM CONTEXT:

${contextText}

CURRENT USER QUESTION:

${question}
`.trim(),
    });

    return response.output_text;
  }

  async *generateStream(
    question: string,
    chunks: RetrievedChunk[],
    conversationContext: RagConversationContext,
  ): AsyncGenerator<string> {
    const context = chunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1}]
Title: ${chunk.title}
Type: ${chunk.sourceType}

${chunk.content}`,
      )
      .join('\n\n');

    const conversationSummary = conversationContext.summary?.trim()
      ? `
Conversation Summary:
${conversationContext.summary}
`
      : '';
    const recentConversation = conversationContext.recentMessages.length
      ? `
Recent conversation:
${conversationContext.recentMessages
  .map(
    (message) =>
      `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`,
  )
  .join('\n')}
`
      : '';

    const stream = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `
You are an AI CRM assistant.

Answer using the supplied CRM context.

Rules:
- Do not invent CRM facts.
- If the supplied CRM context does not contain enough information, say so.
- Use conversation context only to understand follow-up questions and references.
- Prefer concise, useful answers.
          `.trim(),
        },
        {
          role: 'system',
          content: `
${conversationSummary}

${recentConversation}

CRM context:
${context}

Current question:
${question}
          `.trim(),
        },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        yield content;
      }
    }
  }
}
