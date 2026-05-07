import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryLevelDto {
  @ApiProperty({ example: 500, description: 'New inventory level' })
  @IsNumber()
  newLevel: number;

  @ApiProperty({ example: 'Manual recount after delivery' })
  @IsString()
  reason: string;
}
