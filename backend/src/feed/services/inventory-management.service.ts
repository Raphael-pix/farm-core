import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InventoryStatus } from 'generated/prisma/enums';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtUser } from '@/auth/types/request-user.type';
import { NotificationsService } from '@/notifications/notifications.service';
import { INVENTORY_SELECT } from '../feed.service';
import { FeedCatalogService } from './feed-catalog.service';

@Injectable()
export class InventoryManagementService {
  private readonly logger = new Logger(InventoryManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly feedCatalogService: FeedCatalogService,
  ) {}

  async getInventory(feedId: string, user: JwtUser) {
    await this.feedCatalogService.getFeed(feedId, user);

    const inventory = await this.prisma.feedInventory.findUnique({
      where: { farmId_feedId: { farmId: user.farmId, feedId } },
      select: INVENTORY_SELECT,
    });

    if (!inventory) {
      const feed = await this.feedCatalogService.getFeed(feedId, user);
      return {
        id: null,
        feedId,
        feed,
        currentLevel: 0,
        unit: feed.unit,
        location: null,
        lastUpdatedAt: null,
        lastUpdatedReason: null,
        status: 'OUT_OF_STOCK',
        updatedAt: new Date(),
      };
    }

    return inventory;
  }

  async getAllInventories(user: JwtUser) {
    return this.prisma.feedInventory.findMany({
      where: { farmId: user.farmId },
      select: INVENTORY_SELECT,
      orderBy: { feed: { name: 'asc' } },
    });
  }

  async updateInventoryLevel(
    feedId: string,
    newLevel: number,
    reason: string,
    user: JwtUser,
  ) {
    const feed = await this.feedCatalogService.getFeed(feedId, user);

    if (newLevel < 0) {
      throw new BadRequestException('Inventory level cannot be negative');
    }

    let status: InventoryStatus = InventoryStatus.ADEQUATE;
    if (newLevel === 0) {
      status = InventoryStatus.OUT_OF_STOCK;
    } else if (feed.criticalThreshold && newLevel < feed.criticalThreshold) {
      status = InventoryStatus.CRITICAL;
    } else if (feed.lowStockThreshold && newLevel < feed.lowStockThreshold) {
      status = InventoryStatus.LOW;
    }

    const inventory = await this.prisma.feedInventory.upsert({
      where: { farmId_feedId: { farmId: user.farmId, feedId } },
      create: {
        farmId: user.farmId,
        feedId,
        currentLevel: newLevel,
        unit: feed.unit,
        status,
        lastUpdatedAt: new Date(),
        lastUpdatedReason: reason,
        updatedById: user.id,
      },
      update: {
        currentLevel: newLevel,
        status,
        lastUpdatedAt: new Date(),
        lastUpdatedReason: reason,
        updatedById: user.id,
      },
      select: INVENTORY_SELECT,
    });

    this.logger.log(
      `[feedId=${feedId}] Inventory updated: ${inventory.currentLevel} ${inventory.unit}`,
    );

    if (status === InventoryStatus.CRITICAL || status === InventoryStatus.LOW) {
      await this.notificationsService.create(
        {
          type: 'FEED_LOW_STOCK',
          title: `Low stock alert: ${feed.name}`,
          message: `Current level: ${newLevel} ${feed.unit}. Threshold: ${feed.lowStockThreshold}`,
          //   metadata: { feedId, currentLevel: newLevel },
        },
        user.farmId,
        [user.id],
      );
    }

    return inventory;
  }

  async getInventoryStatus(user: JwtUser) {
    const statuses = await this.prisma.feedInventory.groupBy({
      by: ['status'],
      where: { farmId: user.farmId },
      _count: { id: true },
    });

    const inventories = await this.getAllInventories(user);
    const totalValue = inventories.reduce(
      (sum, inv) => sum + inv.currentLevel * (inv.feed.costPerUnit || 0),
      0,
    );

    return {
      byStatus: statuses.reduce(
        (acc, row) => {
          acc[row.status] = row._count.id;
          return acc;
        },
        {} as Record<InventoryStatus, number>,
      ),
      totalValue,
      totalFeeds: inventories.length,
      alertCount:
        (statuses.find((s) => s.status === 'CRITICAL')?._count.id || 0) +
        (statuses.find((s) => s.status === 'LOW')?._count.id || 0),
    };
  }
}
