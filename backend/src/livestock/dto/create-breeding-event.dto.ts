import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBreedingEventDto {
  @ApiProperty({ example: 'uuid-male-id', description: 'Male animal ID' })
  @IsString()
  maleId: string;

  @ApiProperty({ example: 'uuid-female-id', description: 'Female animal ID' })
  @IsString()
  femaleId: string;

  @ApiPropertyOptional({
    example: '2025-05-15',
    description: 'When breeding is planned',
  })
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional({ example: 'Natural mating, no intervention' })
  @IsOptional()
  @IsString()
  notes?: string;
}
