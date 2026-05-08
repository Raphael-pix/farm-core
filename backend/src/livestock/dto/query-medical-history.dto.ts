import { MedicalEventType, MedicalStatus } from 'generated/prisma/client';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMedicalHistoryDto {
  @ApiPropertyOptional({ enum: MedicalStatus })
  @IsOptional()
  @IsEnum(MedicalStatus)
  status?: MedicalStatus;

  @ApiPropertyOptional({ enum: MedicalEventType })
  @IsOptional()
  @IsEnum(MedicalEventType)
  type?: MedicalEventType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
