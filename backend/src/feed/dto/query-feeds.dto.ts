import { FeedType } from 'generated/prisma/enums';
import { IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFeedsDto {
  @ApiPropertyOptional({ enum: FeedType })
  @IsOptional()
  @IsEnum(FeedType)
  type?: FeedType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
