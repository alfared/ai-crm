import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'What do we know about Bright Labs?',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  content!: string;
}
