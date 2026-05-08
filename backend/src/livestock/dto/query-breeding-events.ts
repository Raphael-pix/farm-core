import { BreedingStatus } from 'generated/prisma/client';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryBreedingEventsDto {
  @ApiPropertyOptional({ enum: BreedingStatus })
  @IsOptional()
  @IsEnum(BreedingStatus)
  status?: BreedingStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
