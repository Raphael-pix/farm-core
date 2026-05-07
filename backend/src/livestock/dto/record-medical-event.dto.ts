import { MedicalEventType, MedicalStatus } from 'generated/prisma/client';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordMedicalEventDto {
  @ApiProperty({
    enum: MedicalEventType,
    example: MedicalEventType.VACCINATION,
  })
  @IsEnum(MedicalEventType)
  type: MedicalEventType;

  @ApiPropertyOptional({
    enum: MedicalStatus,
    example: MedicalStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(MedicalStatus)
  status?: MedicalStatus;

  @ApiProperty({ example: 'Annual rabies vaccination' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Given via intramuscular injection' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Foot-and-mouth disease suspected' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Antibiotic injection + isolation' })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiPropertyOptional({ example: 'Rabipur' })
  @IsOptional()
  @IsString()
  medication?: string;

  @ApiPropertyOptional({ example: 1, description: 'Dosage amount' })
  @IsOptional()
  @IsNumber()
  dosage?: number;

  @ApiPropertyOptional({ example: 'ml' })
  @IsOptional()
  @IsString()
  doseUnit?: string;

  @ApiPropertyOptional({ example: 'once daily' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: '5 days' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'Dr. Kiplagat' })
  @IsOptional()
  @IsString()
  veterinarianName?: string;

  @ApiPropertyOptional({ example: 'Nakuru Veterinary Clinic' })
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiPropertyOptional({ example: '2025-04-22', description: 'When scheduled' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({
    example: '2025-04-22T10:30:00Z',
    description: 'When actually done',
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ example: 2500, description: 'in farm currency' })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
