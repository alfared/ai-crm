import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { KnowledgeSourceType } from '../../generated/prisma/client';

export class CreateKnowledgeDocumentDto {
  @ApiProperty({
    example: 'Bright Labs discovery call',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example:
      'Bright Labs is interested in AI lead scoring and CRM automation...',
  })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiPropertyOptional({
    enum: KnowledgeSourceType,
    default: KnowledgeSourceType.MANUAL,
  })
  @IsOptional()
  @IsEnum(KnowledgeSourceType)
  sourceType?: KnowledgeSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;
}
