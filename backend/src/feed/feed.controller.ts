import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';
import { Role } from 'generated/prisma/enums';

import { FeedAllocationService } from './services/feed-allocation.service';
import { FeedCatalogService } from './services/feed-catalog.service';
import { FeedConsumptionService } from './services/feed-consumption.service';
import { InventoryManagementService } from './services/inventory-management.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { QueryFeedsDto } from './dto/query-feeds.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { UpdateInventoryLevelDto } from './dto/update-inventory-level.dto';
import { LogFeedConsumptionDto } from './dto/log-feed-consumption.dto';
import { QueryConsumptionDto } from './dto/query-consumption.dto';
import { AllocateFeedDto, BulkAllocateFeedDto } from './dto/allocate-feed.dto';
import { FeedService } from './feed.service';

@ApiTags('Feed & Inventory')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard)
@Controller({ path: 'feed', version: '1' })
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly allocationService: FeedAllocationService,
    private readonly feedCatalogService: FeedCatalogService,
    private readonly feedConsumptionService: FeedConsumptionService,
    private readonly inventoryManagementService: InventoryManagementService,
  ) {}

  @Post('feeds')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new feed type' })
  @ApiResponse({ status: 201 })
  async createFeed(@Body() dto: CreateFeedDto, @CurrentUser() user: JwtUser) {
    return this.feedCatalogService.createFeed(dto, user);
  }

  @Get('feeds')
  @ApiOperation({ summary: 'List all feeds in farm catalog' })
  async listFeeds(@Query() query: QueryFeedsDto, @CurrentUser() user: JwtUser) {
    return this.feedCatalogService.listFeeds(query, user);
  }

  @Get('feeds/:id')
  @ApiOperation({ summary: 'Get feed details' })
  async getFeed(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedCatalogService.getFeed(id, user);
  }

  @Patch('feeds/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update feed properties' })
  async updateFeed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeedDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedCatalogService.updateFeed(id, dto, user);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get all feed inventories' })
  async getAllInventories(@CurrentUser() user: JwtUser) {
    return this.inventoryManagementService.getAllInventories(user);
  }

  @Get('inventory/:feedId')
  @ApiOperation({ summary: 'Get inventory for specific feed' })
  async getInventory(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.inventoryManagementService.getInventory(feedId, user);
  }

  @Patch('inventory/:feedId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Manually update inventory level' })
  @ApiResponse({ status: 200 })
  async updateInventoryLevel(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @Body() dto: UpdateInventoryLevelDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.inventoryManagementService.updateInventoryLevel(
      feedId,
      dto.newLevel,
      dto.reason,
      user,
    );
  }

  @Get('inventory/status/dashboard')
  @ApiOperation({ summary: 'Get inventory summary for dashboard' })
  async getInventoryStatus(@CurrentUser() user: JwtUser) {
    return this.inventoryManagementService.getInventoryStatus(user);
  }

  @Get('inventory/feed/:feedId/stockout-prediction')
  @ApiOperation({ summary: 'Predict when feed will run out' })
  async predictStockout(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedService.predictStockoutDate(feedId, user);
  }

  @Get('inventory/alerts/low-stock')
  @ApiOperation({ summary: 'Get all low/critical stock alerts' })
  async getLowStockAlerts(@CurrentUser() user: JwtUser) {
    return this.feedConsumptionService.getLowStockAlerts(user);
  }

  @Post('consumption/log')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log feed consumption',
    description:
      'Create immutable consumption record. Automatically updates inventory.',
  })
  async logConsumption(
    @Body() dto: LogFeedConsumptionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedConsumptionService.logConsumption(dto, user);
  }

  @Get('consumption/feed/:feedId')
  @ApiOperation({ summary: 'Get consumption history for a feed' })
  async getConsumptionHistory(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @Query() query: QueryConsumptionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedConsumptionService.getConsumptionHistory(
      feedId,
      query,
      user,
    );
  }

  @Get('consumption/feed/:feedId/daily')
  @ApiOperation({ summary: 'Get daily consumption summary' })
  async getDailyConsumption(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @Query('days') days: number = 30,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedConsumptionService.getDailyConsumption(feedId, days, user);
  }

  @Get('consumption/feed/:feedId/trends')
  @ApiOperation({ summary: 'Get consumption trends and predictions' })
  async getConsumptionTrends(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @Query('days') days: number = 90,
    @CurrentUser() user: JwtUser,
  ) {
    return this.feedConsumptionService.getConsumptionTrends(feedId, days, user);
  }

  @Post('consumption/:consumptionId/allocate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Allocate consumed feed to an animal' })
  async allocateFeed(
    @Param('consumptionId', ParseUUIDPipe) consumptionId: string,
    @Body() dto: AllocateFeedDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.allocationService.allocate(consumptionId, dto, user);
  }

  @Post('consumption/:consumptionId/allocate-bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Allocate consumed feed to multiple animals' })
  async bulkAllocateFeed(
    @Param('consumptionId', ParseUUIDPipe) consumptionId: string,
    @Body() dto: BulkAllocateFeedDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.allocationService.bulkAllocate(consumptionId, dto, user);
  }

  @Get('consumption/:consumptionId/allocations')
  @ApiOperation({
    summary: 'See which animals received feed from this consumption',
  })
  async getAllocationsForConsumption(
    @Param('consumptionId', ParseUUIDPipe) consumptionId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.allocationService.getAllocationsForConsumption(
      consumptionId,
      user,
    );
  }

  @Get('animals/:animalId/feed-history')
  @ApiOperation({ summary: 'See what feed an animal has received' })
  async getFeedHistoryForAnimal(
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @Query('days') days: number = 30,
    @CurrentUser() user: JwtUser,
  ) {
    return this.allocationService.getFeedHistoryForAnimal(animalId, days, user);
  }

  @Get('feed/:feedId/distribution')
  @ApiOperation({ summary: 'Analyze how feed was distributed to animals' })
  async getDistributionAnalysis(
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @Query('days') days: number = 30,
    @CurrentUser() user: JwtUser,
  ) {
    return this.allocationService.getDistributionAnalysis(feedId, days, user);
  }

  @Get('animals/:animalId/feed-cost')
  @ApiOperation({ summary: 'Calculate feed cost per animal' })
  async getPerAnimalCost(
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @Query('days') days: number = 30,
    @CurrentUser() user: JwtUser,
  ) {
    return this.allocationService.getPerAnimalCost(animalId, days, user);
  }
}
