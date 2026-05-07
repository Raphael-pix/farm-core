import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AllocateFeedDto {
  @ApiProperty({ example: 'uuid-animal-id' })
  @IsString()
  animalId: string;

  @ApiProperty({
    example: 25,
    description: 'How much of consumption allocated to this animal',
  })
  @IsNumber()
  quantityAllocated: number;

  @ApiPropertyOptional({ example: 'Fed to nursing cow only' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAllocateFeedDto {
  @ApiProperty({ type: [AllocateFeedDto] })
  allocations: AllocateFeedDto[];
}
