import { FeedType, FeedUnit } from 'generated/prisma/enums';
import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedDto {
  @ApiProperty({ example: 'Maize Grain' })
  @IsString()
  name: string;

  @ApiProperty({ enum: FeedType, example: FeedType.GRAIN })
  @IsEnum(FeedType)
  type: FeedType;

  @ApiPropertyOptional({ example: 'Yellow maize, high protein content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: FeedUnit, example: FeedUnit.KG })
  @IsEnum(FeedUnit)
  unit: FeedUnit;

  @ApiPropertyOptional({
    example: 45.5,
    description: 'Price per unit (e.g., per kg)',
  })
  @IsOptional()
  @IsNumber()
  costPerUnit?: number;

  @ApiPropertyOptional({ example: 'Kikuyu Feed Suppliers' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Alert when below this level',
  })
  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Critical alert when below this',
  })
  @IsOptional()
  @IsNumber()
  criticalThreshold?: number;
}
