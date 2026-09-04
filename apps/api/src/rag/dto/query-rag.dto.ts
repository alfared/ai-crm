import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRagDto {
  @ApiProperty({
    example: 'What do we know about Bright Labs?',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  question!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 6;
}
