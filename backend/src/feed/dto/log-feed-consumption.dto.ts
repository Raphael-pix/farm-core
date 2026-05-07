import { FeedUnit } from 'generated/prisma/enums';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogFeedConsumptionDto {
  @ApiProperty({ example: 'uuid-feed-id' })
  @IsString()
  feedId: string;

  @ApiProperty({ example: 50, description: 'Amount consumed' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ enum: FeedUnit, example: FeedUnit.KG })
  @IsEnum(FeedUnit)
  unit: FeedUnit;

  @ApiPropertyOptional({
    example: '2025-04-22T09:30:00Z',
    description: 'When it was actually consumed',
  })
  @IsOptional()
  @IsDateString()
  observedAt?: string;

  @ApiPropertyOptional({ example: 'Fed to cattle in North paddock' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 25.5,
    description: 'Environmental temperature (C)',
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;
}
