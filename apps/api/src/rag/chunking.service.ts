import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkingService {
  chunk(text: string, chunkSize = 1200, overlap = 200): string[] {
    const normalized = text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (!normalized) {
      return [];
    }

    const chunks: string[] = [];

    let start = 0;

    while (start < normalized.length) {
      const end = Math.min(normalized.length, start + chunkSize);

      const chunk = normalized.slice(start, end).trim();

      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= normalized.length) {
        break;
      }

      start = Math.max(end - overlap, start + 1);
    }

    return chunks;
  }
}
