import { Module } from '@nestjs/common';
import { LivestockService } from './livestock.service';
import { LivestockController } from './livestock.controller';

@Module({
  controllers: [LivestockController],
  providers: [LivestockService],
})
export class LivestockModule {}
