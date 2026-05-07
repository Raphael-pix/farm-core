import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { NotificationsModule } from '@/notifications/notifications.module';
import { FeedAllocationService } from './services/feed-allocation.service';
import { FeedCatalogService } from './services/feed-catalog.service';
import { FeedConsumptionService } from './services/feed-consumption.service';
import { InventoryManagementService } from './services/inventory-management.service';

@Module({
  imports: [NotificationsModule],
  controllers: [FeedController],
  providers: [
    FeedService,
    FeedAllocationService,
    FeedCatalogService,
    FeedConsumptionService,
    InventoryManagementService,
  ],
})
export class FeedModule {}
