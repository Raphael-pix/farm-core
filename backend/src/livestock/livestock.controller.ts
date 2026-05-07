import { Controller } from '@nestjs/common';
import { LivestockService } from './livestock.service';

@Controller('livestock')
export class LivestockController {
  constructor(private readonly livestockService: LivestockService) {}
}
