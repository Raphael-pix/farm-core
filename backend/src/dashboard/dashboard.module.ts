import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AgentQueriesService } from './services/agent-queries.services';
import { DashboardSummariesService } from './services/dashboard-summaries.services';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, AgentQueriesService, DashboardSummariesService],
  exports: [DashboardService],
})
export class DashboardModule {}
