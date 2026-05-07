import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtUser } from '@/auth/types/request-user.type';

import { CreateFeedDto } from '../dto/create-feed.dto';
import { UpdateFeedDto } from '../dto/update-feed.dto';
import { QueryFeedsDto } from '../dto/query-feeds.dto';
import { FEED_SELECT } from '../feed.service';

@Injectable()
export class FeedCatalogService {
  private readonly logger = new Logger(FeedCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createFeed(dto: CreateFeedDto, user: JwtUser) {
    const feed = await this.prisma.feed.create({
      data: {
        farmId: user.farmId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        unit: dto.unit,
        costPerUnit: dto.costPerUnit,
        supplier: dto.supplier,
        lowStockThreshold: dto.lowStockThreshold,
        criticalThreshold: dto.criticalThreshold,
        createdById: user.id,
      },
      select: FEED_SELECT,
    });

    this.logger.log(
      `[farmId=${user.farmId}] Created feed: ${feed.id} (${feed.name})`,
    );
    return feed;
  }

  async listFeeds(query: QueryFeedsDto, user: JwtUser) {
    const { type, isActive = true, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FeedWhereInput = {
      farmId: user.farmId,
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    };

    const [feeds, total] = await this.prisma.$transaction([
      this.prisma.feed.findMany({
        where,
        select: FEED_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.feed.count({ where }),
    ]);

    return {
      data: feeds,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFeed(id: string, user: JwtUser) {
    const feed = await this.prisma.feed.findFirst({
      where: { id, farmId: user.farmId },
      select: FEED_SELECT,
    });

    if (!feed) throw new NotFoundException(`Feed ${id} not found`);
    return feed;
  }

  async updateFeed(id: string, dto: UpdateFeedDto, user: JwtUser) {
    await this.getFeed(id, user);

    const updated = await this.prisma.feed.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.costPerUnit !== undefined && { costPerUnit: dto.costPerUnit }),
        ...(dto.supplier !== undefined && { supplier: dto.supplier }),
        ...(dto.lowStockThreshold !== undefined && {
          lowStockThreshold: dto.lowStockThreshold,
        }),
        ...(dto.criticalThreshold !== undefined && {
          criticalThreshold: dto.criticalThreshold,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedById: user.id,
      },
      select: FEED_SELECT,
    });

    return updated;
  }
}
