import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiPropertyOptional({
    example: '33e84f49-0eb8-43cf-a18d-890c482d0576',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    example: 'Smith',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({
    example: 'john.smith@acme.example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: '+420 123 456 789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'Primary technical contact',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
