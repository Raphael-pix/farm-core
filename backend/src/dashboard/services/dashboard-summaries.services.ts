import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { AppConfig } from '@/config/configuration';

@Injectable()
export class DashboardSummariesService {
  private readonly logger = new Logger(DashboardSummariesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getFieldsSummary(farmId: string) {
    const fields = await this.prisma.field.findMany({
      where: { farmId, isArchived: false },
      select: {
        id: true,
        currentStage: true,
        lastUpdatedAt: true,
        plantingDate: true,
      },
    });

    const byStage = fields.reduce(
      (acc, f) => {
        acc[f.currentStage] = (acc[f.currentStage] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const atRiskThreshold = this.config.get('fieldStatus.atRiskThresholdDays', {
      infer: true,
    });
    const atRisk = fields.filter((f) => {
      const lastUpdate = f.lastUpdatedAt || f.plantingDate;
      if (!lastUpdate) return false;
      const daysSince = dayjs().diff(dayjs(lastUpdate), 'day');
      return daysSince > atRiskThreshold;
    }).length;

    return {
      total: fields.length,
      byStage,
      atRisk,
      recentlyUpdated: fields.filter((f) => {
        const lastUpdate = f.lastUpdatedAt || f.plantingDate;
        return dayjs().diff(dayjs(lastUpdate), 'day') <= 1;
      }).length,
    };
  }

  async getHerdSummary(farmId: string) {
    const animals = await this.prisma.animal.groupBy({
      by: ['species', 'status'],
      where: { farmId },
      _count: { id: true },
    });

    const bySpecies = animals.reduce(
      (acc, row) => {
        if (!acc[row.species]) acc[row.species] = {};
        acc[row.species][row.status] = row._count.id;
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    );

    const totalAnimals = animals.reduce((sum, row) => sum + row._count.id, 0);

    return {
      total: totalAnimals,
      bySpecies,
      active: animals
        .filter((a) => a.status === 'ACTIVE')
        .reduce((sum, a) => sum + a._count.id, 0),
    };
  }

  async getInventorySummary(farmId: string) {
    const inventories = await this.prisma.feedInventory.findMany({
      where: { farmId },
      select: {
        status: true,
        feed: { select: { name: true } },
        currentLevel: true,
      },
    });

    const byStatus = inventories.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const alerts = inventories.filter(
      (inv) => inv.status === 'CRITICAL' || inv.status === 'LOW',
    ).length;

    return {
      total: inventories.length,
      byStatus,
      alertCount: alerts,
      feedsLowStock: inventories
        .filter((inv) => inv.status === 'LOW' || inv.status === 'CRITICAL')
        .map((inv) => inv.feed.name),
    };
  }

  async getTasksSummary(farmId: string) {
    const tasks = await this.prisma.task.groupBy({
      by: ['status'],
      where: { farmId },
      _count: { id: true },
    });

    const byStatus = tasks.reduce(
      (acc, row) => {
        acc[row.status] = row._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const overdue = await this.prisma.task.count({
      where: {
        farmId,
        dueDate: { lt: new Date() },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    return {
      total: tasks.reduce((sum, t) => sum + t._count.id, 0),
      byStatus,
      overdue,
    };
  }

  async getHealthAlerts(farmId: string) {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    const [recentIllnesses, missedTreatments, upcomingVaccinations] =
      await Promise.all([
        this.prisma.medicalRecord.findMany({
          where: {
            farmId,
            type: 'ILLNESS',
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            animal: { select: { id: true, name: true, species: true } },
            diagnosis: true,
            createdAt: true,
          },
          take: 5,
        }),
        this.prisma.medicalRecord.findMany({
          where: {
            farmId,
            status: 'MISSED',
          },
          select: {
            animal: { select: { id: true, name: true, species: true } },
            title: true,
          },
          take: 5,
        }),
        this.prisma.medicalRecord.findMany({
          where: {
            farmId,
            type: 'VACCINATION',
            status: 'SCHEDULED',
            scheduledFor: {
              gte: new Date(),
              lte: dayjs().add(7, 'day').toDate(),
            },
          },
          select: {
            animal: { select: { id: true, name: true, species: true } },
            title: true,
            scheduledFor: true,
          },
          take: 5,
        }),
      ]);

    return {
      recentIllnesses,
      missedTreatments,
      upcomingVaccinations,
      total:
        recentIllnesses.length +
        missedTreatments.length +
        upcomingVaccinations.length,
    };
  }

  async getRecentActivity(farmId: string) {
    const [fieldUpdates, medicalEvents, taskCompletions] = await Promise.all([
      this.prisma.fieldUpdate.findMany({
        where: { field: { farmId } },
        select: {
          id: true,
          field: { select: { id: true, name: true } },
          stage: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.medicalRecord.findMany({
        where: { farmId },
        select: {
          id: true,
          animal: { select: { id: true, name: true } },
          type: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.taskCompletion.findMany({
        where: { farmId },
        select: {
          task: { select: { id: true, title: true } },
          completedAt: true,
          completedBy: { select: { fullName: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      fieldUpdates,
      medicalEvents,
      taskCompletions,
    };
  }
}
