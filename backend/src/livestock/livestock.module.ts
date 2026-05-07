import { Module } from '@nestjs/common';
import { LivestockService } from './livestock.service';
import { LivestockController } from './livestock.controller';
import { NotificationsModule } from '@/notifications/notifications.module';
import { AnimalRegistryService } from './services/animal-registry.service';
import { MedicalRecordsService } from './services/medical-records.service';
import { BreedingService } from './services/breeding.service';
import { MortalityService } from './services/mortality.service';

@Module({
  imports: [NotificationsModule],
  controllers: [LivestockController],
  providers: [
    LivestockService,
    AnimalRegistryService,
    MedicalRecordsService,
    BreedingService,
    MortalityService,
  ],
  exports: [LivestockService],
})
export class LivestockModule {}
