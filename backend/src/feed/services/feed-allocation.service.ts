import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtUser } from '@/auth/types/request-user.type';
import { AllocateFeedDto, BulkAllocateFeedDto } from '../dto/allocate-feed.dto';

const ALLOCATION_SELECT = {
  id: true,
  consumptionId: true,
  feedId: true,
  feed: { select: { id: true, name: true, type: true, unit: true } },
  animalId: true,
  animal: { select: { id: true, name: true, species: true } },
  quantityAllocated: true,
  notes: true,
  createdAt: true,
} as const;

@Injectable()
export class FeedAllocationService {
  private readonly logger = new Logger(FeedAllocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async allocate(consumptionId: string, dto: AllocateFeedDto, user: JwtUser) {
    const consumption = await this.prisma.feedConsumption.findFirst({
      where: { id: consumptionId, farmId: user.farmId },
      select: { id: true, quantity: true, feedId: true },
    });

    if (!consumption) {
      throw new NotFoundException(`Consumption ${consumptionId} not found`);
    }

    const animal = await this.prisma.animal.findFirst({
      where: { id: dto.animalId, farmId: user.farmId },
      select: { id: true, name: true },
    });

    if (!animal) {
      throw new NotFoundException(`Animal ${dto.animalId} not found`);
    }

    if (dto.quantityAllocated > consumption.quantity) {
      throw new BadRequestException(
        `Allocation quantity (${dto.quantityAllocated}) exceeds consumption (${consumption.quantity})`,
      );
    }

    const allocation = await this.prisma.feedAllocation.create({
      data: {
        farmId: user.farmId,
        consumptionId,
        feedId: consumption.feedId,
        animalId: dto.animalId,
        quantityAllocated: dto.quantityAllocated,
        notes: dto.notes,
      },
      select: ALLOCATION_SELECT,
    });

    this.logger.log(
      `[consumptionId=${consumptionId}] Allocated ${dto.quantityAllocated} to animal ${animal.id}`,
    );

    return allocation;
  }

  async bulkAllocate(
    consumptionId: string,
    dto: BulkAllocateFeedDto,
    user: JwtUser,
  ) {
    const consumption = await this.prisma.feedConsumption.findFirst({
      where: { id: consumptionId, farmId: user.farmId },
      select: { id: true, quantity: true, feedId: true },
    });

    if (!consumption) {
      throw new NotFoundException(`Consumption ${consumptionId} not found`);
    }

    const totalAllocated = dto.allocations.reduce(
      (sum, a) => sum + a.quantityAllocated,
      0,
    );
    if (totalAllocated > consumption.quantity) {
      throw new BadRequestException(
        `Total allocation (${totalAllocated}) exceeds consumption (${consumption.quantity})`,
      );
    }

    const animalIds = dto.allocations.map((a) => a.animalId);
    const animals = await this.prisma.animal.findMany({
      where: { id: { in: animalIds }, farmId: user.farmId },
      select: { id: true },
    });

    if (animals.length !== animalIds.length) {
      throw new BadRequestException(
        'One or more animals not found in this farm',
      );
    }

    const allocations = await this.prisma.$transaction(
      dto.allocations.map((alloc) =>
        this.prisma.feedAllocation.create({
          data: {
            farmId: user.farmId,
            consumptionId,
            feedId: consumption.feedId,
            animalId: alloc.animalId,
            quantityAllocated: alloc.quantityAllocated,
            notes: alloc.notes,
          },
          select: ALLOCATION_SELECT,
        }),
      ),
    );

    this.logger.log(
      `[consumptionId=${consumptionId}] Bulk allocated to ${allocations.length} animals`,
    );

    return allocations;
  }

  async getAllocationsForConsumption(consumptionId: string, user: JwtUser) {
    const consumption = await this.prisma.feedConsumption.findFirst({
      where: { id: consumptionId, farmId: user.farmId },
    });

    if (!consumption)
      throw new NotFoundException(`Consumption ${consumptionId} not found`);

    return this.prisma.feedAllocation.findMany({
      where: { consumptionId },
      select: ALLOCATION_SELECT,
    });
  }

  async getFeedHistoryForAnimal(animalId: string, days = 30, user: JwtUser) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, farmId: user.farmId },
    });

    if (!animal) throw new NotFoundException(`Animal ${animalId} not found`);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.prisma.feedAllocation.findMany({
      where: {
        farmId: user.farmId,
        animalId,
        createdAt: { gte: cutoff },
      },
      select: ALLOCATION_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDistributionAnalysis(feedId: string, days = 30, user: JwtUser) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const distribution = await this.prisma.feedAllocation.groupBy({
      by: ['animalId'],
      where: {
        farmId: user.farmId,
        feedId,
        createdAt: { gte: cutoff },
      },
      _sum: { quantityAllocated: true },
      _count: { id: true },
    });

    const animalIds = distribution
      .map((d) => d.animalId)
      .filter((id): id is string => id !== null);
    const animals = await this.prisma.animal.findMany({
      where: { id: { in: animalIds } },
      select: { id: true, name: true, species: true },
    });

    type AnimalMap = Record<string, (typeof animals)[number]>;

    const animalMap = animals.reduce<AnimalMap>((acc, a) => {
      acc[a.id] = a;
      return acc;
    }, {});

    return distribution.map((row) => ({
      animal: row.animalId ? animalMap[row.animalId] : null,
      totalQuantity: row._sum.quantityAllocated || 0,
      allocations: row._count.id,
      averagePerAllocation:
        (row._sum.quantityAllocated || 0) / (row._count.id || 1),
    }));
  }

  async getPerAnimalCost(animalId: string, days = 30, user: JwtUser) {
    const allocations = await this.getFeedHistoryForAnimal(
      animalId,
      days,
      user,
    );

    const costByFeed: Record<
      string,
      { feedName: string; quantity: number; costPerUnit: number }
    > = {};

    for (const alloc of allocations) {
      const feedId = alloc.feedId;
      if (!costByFeed[feedId]) {
        costByFeed[feedId] = {
          feedName: alloc.feed.name,
          quantity: 0,
          costPerUnit: 0,
        };
      }
      costByFeed[feedId].quantity += alloc.quantityAllocated;
    }

    let totalCost = 0;
    for (const feedId in costByFeed) {
      const feed = await this.prisma.feed.findUnique({
        where: { id: feedId },
        select: { costPerUnit: true },
      });
      if (feed?.costPerUnit) {
        const cost = costByFeed[feedId].quantity * feed.costPerUnit;
        costByFeed[feedId].costPerUnit = feed.costPerUnit;
        totalCost += cost;
      }
    }

    return {
      animalId,
      period: days,
      costByFeed,
      totalCost,
    };
  }
}
