import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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

  async generate(question: string, context: RagContext[]): Promise<string> {
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
CRM CONTEXT:

${contextText}

QUESTION:

${question}
      `.trim(),
    });

    return response.output_text;
  }
}
