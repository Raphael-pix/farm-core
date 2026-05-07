import { Injectable, Logger } from '@nestjs/common';
import { InventoryStatus } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtUser } from '@/auth/types/request-user.type';

import { LogFeedConsumptionDto } from '../dto/log-feed-consumption.dto';
import { QueryConsumptionDto } from '../dto/query-consumption.dto';
import { INVENTORY_SELECT, CONSUMPTION_SELECT } from '../feed.service';
import { InventoryManagementService } from './inventory-management.service';
import { FeedCatalogService } from './feed-catalog.service';

@Injectable()
export class FeedConsumptionService {
  private readonly logger = new Logger(FeedConsumptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedCatalogService: FeedCatalogService,
    private readonly inventoryManagementService: InventoryManagementService,
  ) {}

  async logConsumption(dto: LogFeedConsumptionDto, user: JwtUser) {
    await this.feedCatalogService.getFeed(dto.feedId, user);

    const consumption = await this.prisma.feedConsumption.create({
      data: {
        farmId: user.farmId,
        feedId: dto.feedId,
        quantity: dto.quantity,
        unit: dto.unit,
        observedAt: dto.observedAt ? new Date(dto.observedAt) : new Date(),
        notes: dto.notes,
        temperature: dto.temperature,
        recordedById: user.id,
      },
      select: CONSUMPTION_SELECT,
    });

    const currentInventory = await this.inventoryManagementService.getInventory(
      dto.feedId,
      user,
    );
    const newLevel = Math.max(
      0,
      (currentInventory.currentLevel || 0) - dto.quantity,
    );

    await this.inventoryManagementService.updateInventoryLevel(
      dto.feedId,
      newLevel,
      `Consumed ${dto.quantity} ${dto.unit}`,
      user,
    );

    this.logger.log(
      `[feedId=${dto.feedId}] Consumption logged: ${dto.quantity} ${dto.unit}`,
    );

    return consumption;
  }

  async getConsumptionHistory(
    feedId: string,
    query: QueryConsumptionDto,
    user: JwtUser,
  ) {
    await this.feedCatalogService.getFeed(feedId, user);

    const { days = 30, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const cutoff = dayjs().subtract(days, 'day').toDate();

    const where: Prisma.FeedConsumptionWhereInput = {
      farmId: user.farmId,
      feedId,
      observedAt: { gte: cutoff },
    };

    const [consumptions, total] = await this.prisma.$transaction([
      this.prisma.feedConsumption.findMany({
        where,
        select: CONSUMPTION_SELECT,
        skip,
        take: limit,
        orderBy: { observedAt: 'desc' },
      }),
      this.prisma.feedConsumption.count({ where }),
    ]);

    return {
      data: consumptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        daysViewed: days,
      },
    };
  }

  async getDailyConsumption(feedId: string, days = 30, user: JwtUser) {
    await this.feedCatalogService.getFeed(feedId, user);

    const cutoff = dayjs().subtract(days, 'day').toDate();

    const summary = await this.prisma.feedConsumption.groupBy({
      by: ['observedAt'],
      where: {
        farmId: user.farmId,
        feedId,
        observedAt: { gte: cutoff },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { observedAt: 'desc' },
    });

    return summary.map((row) => ({
      date: row.observedAt,
      totalQuantity: row._sum.quantity || 0,
      entries: row._count.id,
    }));
  }

  async getConsumptionTrends(feedId: string, days = 90, user: JwtUser) {
    await this.feedCatalogService.getFeed(feedId, user);

    const cutoff = dayjs().subtract(days, 'day').toDate();

    const consumptions = await this.prisma.feedConsumption.findMany({
      where: {
        farmId: user.farmId,
        feedId,
        observedAt: { gte: cutoff },
      },
      select: { quantity: true, observedAt: true },
    });

    const totalQuantity = consumptions.reduce((sum, c) => sum + c.quantity, 0);
    const avgDaily = consumptions.length > 0 ? totalQuantity / days : 0;
    const maxDaily = Math.max(...consumptions.map((c) => c.quantity), 0);
    const minDaily = Math.min(...consumptions.map((c) => c.quantity), 0);

    return {
      period: { days, from: cutoff, to: new Date() },
      totalQuantity,
      avgDaily,
      maxDaily,
      minDaily,
      entries: consumptions.length,
    };
  }

  async getLowStockAlerts(user: JwtUser) {
    const inventories = await this.prisma.feedInventory.findMany({
      where: {
        farmId: user.farmId,
        status: {
          in: [
            InventoryStatus.LOW,
            InventoryStatus.CRITICAL,
            InventoryStatus.OUT_OF_STOCK,
          ],
        },
      },
      select: INVENTORY_SELECT,
      orderBy: { status: 'asc' },
    });

    return inventories;
  }
}
