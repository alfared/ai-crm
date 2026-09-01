import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

type SummaryMessage = {
  role: string;
  content: string;
};

@Injectable()
export class ConversationSummaryService {
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

  async summarize(
    previousSummary: string | null,
    messages: SummaryMessage[],
  ): Promise<string> {
    if (messages.length === 0) {
      return previousSummary ?? '';
    }
    const messagesText = messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n\n');

    const response = await this.client.responses.create({
      model: this.model,
      instructions: `
You maintain long-term memory for an AI assistant inside a CRM.

Create a concise, information-dense summary.

Preserve information that may be important later:
- company names
- contact names
- lead names
- relationships between CRM entities
- monetary values and currencies
- statuses
- dates and deadlines
- decisions
- user requests and preferences relevant to the conversation
- unresolved questions
- references required to understand future pronouns or follow-up questions

Rules:
- Merge the previous summary with the new messages.
- Do not invent information.
- Do not include irrelevant conversational filler.
- Preserve concrete facts exactly when possible.
- Return only the updated summary.
        `.trim(),
      input: `
PREVIOUS SUMMARY:

${previousSummary ?? 'None'}

NEW MESSAGES:

${messagesText}
        `.trim(),
    });

    return response.output_text.trim();
  }
}
