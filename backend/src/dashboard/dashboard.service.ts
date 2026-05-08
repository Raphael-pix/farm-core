import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CacheService } from '@/cache/cache.service';
import { AppConfig } from '@/config/configuration';
import { JwtUser } from '@/auth/types/request-user.type';
import { DashboardSummariesService } from './services/dashboard-summaries.services';
import { AgentQueriesService } from './services/agent-queries.services';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly cache: CacheService,
    private readonly dashboardSummariesService: DashboardSummariesService,
    private readonly agentQueriesService: AgentQueriesService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getAdminDashboard(user: JwtUser) {
    const farmId = user.farmId;
    const cacheKey = this.cache.dashboardKey(`admin:${farmId}`);

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('Admin dashboard served from cache');
      const result = cached as string;
      return result;
    }

    const data = await this.buildAdminDashboard(farmId);

    await this.cache.set(
      cacheKey,
      JSON.stringify(data),
      this.config.get('cache.ttlDashboard', { infer: true }),
    );

    return data;
  }

  async buildAdminDashboard(farmId: string) {
    const [
      fieldsSummary,
      herdSummary,
      inventorySummary,
      tasksSummary,
      healthAlerts,
      recentActivity,
    ] = await Promise.all([
      this.dashboardSummariesService.getFieldsSummary(farmId),
      this.dashboardSummariesService.getHerdSummary(farmId),
      this.dashboardSummariesService.getInventorySummary(farmId),
      this.dashboardSummariesService.getTasksSummary(farmId),
      this.dashboardSummariesService.getHealthAlerts(farmId),
      this.dashboardSummariesService.getRecentActivity(farmId),
    ]);

    return {
      farmId,
      timestamp: new Date().toISOString(),
      summary: {
        fields: fieldsSummary,
        herd: herdSummary,
        inventory: inventorySummary,
        tasks: tasksSummary,
      },
      alerts: {
        healthAlerts,
      },
      recentActivity,
      generatedAt: new Date(),
    };
  }

  async getAgentDashboard(user: JwtUser) {
    const cacheKey = this.cache.dashboardKey(`agent:${user.id}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Agent dashboard for ${user.id} served from cache`);
      const result = cached as string;
      return result;
    }

    const data = await this.buildAgentDashboard(user);

    await this.cache.set(
      cacheKey,
      JSON.stringify(data),
      this.config.get('cache.ttlDashboard', { infer: true }),
    );

    return data;
  }

  async buildAgentDashboard(user: JwtUser) {
    const agentId = user.id;
    const farmId = user.farmId;

    const [
      assignedFields,
      assignedAnimals,
      myTasks,
      fieldUpdatesNeeded,
      healthChecksNeeded,
    ] = await Promise.all([
      this.agentQueriesService.getAssignedFields(agentId, farmId),
      this.agentQueriesService.getAssignedAnimals(agentId, farmId),
      this.agentQueriesService.getMyTasks(agentId, farmId),
      this.agentQueriesService.getFieldUpdatesNeeded(agentId, farmId),
      this.agentQueriesService.getHealthChecksNeeded(agentId, farmId),
    ]);

    return {
      userId: agentId,
      farmId: farmId,
      timestamp: new Date().toISOString(),
      myWork: {
        assignedFields,
        assignedAnimals,
        tasks: myTasks,
      },
      actionRequired: {
        fieldUpdatesNeeded,
        healthChecksNeeded,
      },
      generatedAt: new Date(),
    };
  }

  async invalidateAdminDashboard(farmId: string) {
    const cacheKey = this.cache.dashboardKey(`admin:${farmId}`);
    await this.cache.del(cacheKey);
    this.logger.debug(`[farmId=${farmId}] Admin dashboard cache invalidated`);
  }

  async invalidateAgentDashboard(agentId: string) {
    const cacheKey = this.cache.dashboardKey(`agent:${agentId}`);
    await this.cache.del(cacheKey);
    this.logger.debug(`[agentId=${agentId}] Agent dashboard cache invalidated`);
  }
}
