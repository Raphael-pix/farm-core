import { DeathCause } from 'generated/prisma/client';
import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordMortalityDto {
  @ApiProperty({
    enum: DeathCause,
    example: DeathCause.DISEASE,
  })
  @IsEnum(DeathCause)
  cause: DeathCause;

  @ApiPropertyOptional({ example: 'Pneumonia, high fever, weakness' })
  @IsOptional()
  @IsString()
  causeDetails?: string;

  @ApiProperty({ example: '2025-04-22', description: 'ISO 8601 date' })
  @IsDateString()
  dateOfDeath: string;

  @ApiPropertyOptional({ example: 'North paddock' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '5 years 3 months' })
  @IsOptional()
  @IsString()
  age?: string;

  @ApiPropertyOptional({
    example: 'Signs of respiratory infection. Cultures sent to lab.',
  })
  @IsOptional()
  @IsString()
  postMortemNotes?: string;

  @ApiPropertyOptional({
    example: 'buried',
    enum: ['buried', 'incinerated', 'composted'],
  })
  @IsOptional()
  @IsString()
  bodyDisposal?: string;
}
