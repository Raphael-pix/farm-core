import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@/config/configuration';

@Injectable()
export class AgentQueriesService {
  private readonly logger = new Logger(AgentQueriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getAssignedFields(agentId: string, farmId: string) {
    return this.prisma.field.findMany({
      where: { agentId, farmId, isArchived: false },
      select: {
        id: true,
        name: true,
        cropType: true,
        currentStage: true,
        location: { select: { county: true, subCounty: true } },
      },
      take: 10,
    });
  }

  async getAssignedAnimals(agentId: string, farmId: string) {
    // Future: When we add agentId to animals
    // For now, return animals in fields assigned to agent
    const fields = await this.prisma.field.findMany({
      where: { agentId, farmId },
      select: { locationId: true },
    });

    const locationIds = fields.map((f) => f.locationId).filter(Boolean);

    if (locationIds.length === 0) {
      return [];
    }

    return this.prisma.animal.findMany({
      where: {
        farmId,
        locationId: { in: locationIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        species: true,
        status: true,
      },
      take: 10,
    });
  }

  async getMyTasks(agentId: string, farmId: string) {
    return this.prisma.task.findMany({
      where: {
        assignedToId: agentId,
        farmId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
      },
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        dueDate: true,
        status: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });
  }

  async getFieldUpdatesNeeded(agentId: string, farmId: string) {
    const atRiskThreshold = this.config.get('fieldStatus.atRiskThresholdDays', {
      infer: true,
    });
    const cutoff = dayjs().subtract(atRiskThreshold, 'day').toDate();

    return this.prisma.field.findMany({
      where: {
        agentId,
        farmId,
        isArchived: false,
        lastUpdatedAt: { lt: cutoff },
      },
      select: {
        id: true,
        name: true,
        cropType: true,
        lastUpdatedAt: true,
      },
      take: 10,
    });
  }

  async getHealthChecksNeeded(agentId: string, farmId: string) {
    const fields = await this.prisma.field.findMany({
      where: { agentId, farmId },
      select: { locationId: true },
    });

    const locationIds = fields.map((f) => f.locationId).filter(Boolean);

    if (locationIds.length === 0) {
      return [];
    }

    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    return this.prisma.animal.findMany({
      where: {
        farmId,
        locationId: { in: locationIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        species: true,
        medicalRecords: {
          where: {
            type: 'HEALTH_CHECK',
            createdAt: { lt: thirtyDaysAgo },
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 10,
    });
  }
}
