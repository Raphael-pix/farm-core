import { Species, Sex } from 'generated/prisma/enums';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAnimalDto {
  @ApiPropertyOptional({ example: 'Bessie' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: Species, example: Species.CATTLE })
  @IsEnum(Species)
  species: Species;

  @ApiPropertyOptional({ example: 'Holstein Friesian' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ enum: Sex, example: Sex.FEMALE })
  @IsEnum(Sex)
  sex: Sex;

  @ApiPropertyOptional({ example: '2023-03-15', description: 'ISO 8601 date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: '2025-01-10',
    description: 'If acquired from outside',
  })
  @IsOptional()
  @IsDateString()
  acquiredDate?: string;

  @ApiPropertyOptional({ example: 'Black and white' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 650, description: 'in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 145, description: 'in cm' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 'uuid-location-id' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    example: 'uuid-male-parent-id',
    description: 'If born on farm',
  })
  @IsOptional()
  @IsString()
  maleParentId?: string;

  @ApiPropertyOptional({
    example: 'uuid-female-parent-id',
    description: 'If born on farm',
  })
  @IsOptional()
  @IsString()
  femaleParentId?: string;

  @ApiPropertyOptional({ example: 'Purchased from Kikuyu market' })
  @IsOptional()
  @IsString()
  notes?: string;
}
