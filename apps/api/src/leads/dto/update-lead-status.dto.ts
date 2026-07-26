import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LeadStatus } from '../../generated/prisma/client';

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: LeadStatus,
    example: LeadStatus.CONTACTED,
  })
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}
