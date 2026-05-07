import { Species, AnimalStatus } from 'generated/prisma/client';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnimalsDto {
  @ApiPropertyOptional({ enum: Species })
  @IsOptional()
  @IsEnum(Species)
  species?: Species;

  @ApiPropertyOptional({ enum: AnimalStatus })
  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;

  @ApiPropertyOptional({ example: 'Nakuru' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    example: 'dateOfBirth',
    enum: ['createdAt', 'dateOfBirth', 'name', 'weight'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
