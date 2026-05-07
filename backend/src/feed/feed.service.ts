import { Injectable, Logger } from '@nestjs/common';

import dayjs from 'dayjs';

import { JwtUser } from '@/auth/types/request-user.type';
import { InventoryManagementService } from './services/inventory-management.service';
import { FeedConsumptionService } from './services/feed-consumption.service';

export const FEED_SELECT = {
  id: true,
  farmId: true,
  name: true,
  type: true,
  description: true,
  unit: true,
  costPerUnit: true,
  supplier: true,
  lowStockThreshold: true,
  criticalThreshold: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const INVENTORY_SELECT = {
  id: true,
  feedId: true,
  feed: { select: FEED_SELECT },
  currentLevel: true,
  unit: true,
  location: true,
  lastUpdatedAt: true,
  lastUpdatedReason: true,
  status: true,
  updatedAt: true,
} as const;

export const CONSUMPTION_SELECT = {
  id: true,
  feedId: true,
  feed: { select: { id: true, name: true, type: true } },
  quantity: true,
  unit: true,
  observedAt: true,
  createdAt: true,
  notes: true,
  temperature: true,
  recordedBy: { select: { id: true, fullName: true, email: true } },
} as const;

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly inventoryManagementService: InventoryManagementService,
    private readonly feedConsumptionService: FeedConsumptionService,
  ) {}

  async predictStockoutDate(feedId: string, user: JwtUser) {
    const inventory = await this.inventoryManagementService.getInventory(
      feedId,
      user,
    );
    const trends = await this.feedConsumptionService.getConsumptionTrends(
      feedId,
      30,
      user,
    );

    if (trends.avgDaily === 0 || inventory.currentLevel === 0) {
      return null;
    }

    const daysUntilStockout = inventory.currentLevel / trends.avgDaily;
    const stockoutDate = dayjs().add(daysUntilStockout, 'day').toDate();

    return {
      predictedDate: stockoutDate,
      daysRemaining: Math.ceil(daysUntilStockout),
      currentLevel: inventory.currentLevel,
      avgDailyConsumption: trends.avgDaily,
      confidence: trends.entries > 7 ? 'HIGH' : 'LOW', // Confidence increases with data
    };
  }
}
