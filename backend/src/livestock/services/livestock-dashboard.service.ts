import { Injectable, Logger } from '@nestjs/common';
import { JwtUser } from '@/auth/types/request-user.type';
import { PrismaService } from '@/prisma/prisma.service';
import { AnimalStatus, Species } from 'generated/prisma/enums';
import { MedicalRecordsService } from './medical-records.service';
import { CacheService } from '@/cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@/config/configuration';

@Injectable()
export class LivestockDashboardService {
  private readonly logger = new Logger(LivestockDashboardService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly medicalRecords: MedicalRecordsService,
    private readonly cache: CacheService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getLivestockDashboard(user: JwtUser) {
    const farmId = user.farmId;
    const cacheKey = this.cache.livestockDashboardKey(`livestock:${farmId}`);

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('Livestock dashboard served from cache');
      const result = cached as string;
      return result;
    }

    const data = await this.buildLivestockDashboard(user);

    await this.cache.set(
      cacheKey,
      JSON.stringify(data),
      this.config.get('cache.ttlDashboard', { infer: true }),
    );

    return data;
  }

  async buildLivestockDashboard(user: JwtUser) {
    const farmId = user.farmId;

    const [summary, statusDistribution, mortalityTrend, healthAlerts] =
      await Promise.all([
        this.getSummary(farmId),
        this.getStatusDistribution(farmId),
        this.getMortalityTrend(farmId),
        this.getHealthAlerts(user),
      ]);

    return {
      farmId,
      timestamp: new Date().toISOString(),
      summary,
      statusDistribution,
      mortalityTrend,
      healthAlerts,
      generatedAt: new Date(),
    };
  }

  private async getSummary(farmId: string) {
    const animals = await this.prisma.animal.groupBy({
      by: ['species', 'status'],
      where: { farmId },
      _count: { id: true },
    });

    const bySpecies: Record<string, number> = {};
    const byStatus: Partial<Record<AnimalStatus, number>> = {};

    let totalAnimals = 0;

    for (const row of animals) {
      totalAnimals += row._count.id;

      bySpecies[row.species] = (bySpecies[row.species] ?? 0) + row._count.id;

      byStatus[row.status] = (byStatus[row.status] ?? 0) + row._count.id;
    }

    return {
      totalAnimals,
      bySpecies,
      byStatus,
    };
  }

  private async getStatusDistribution(farmId: string) {
    const stats = await this.prisma.animal.groupBy({
      by: ['status'],
      where: { farmId },
      _count: { id: true },
    });

    return stats.reduce(
      (acc, row) => {
        acc[row.status] = row._count.id;
        return acc;
      },
      {} as Record<AnimalStatus, number>,
    );
  }

  private async getMortalityTrend(farmId: string) {
    const mortalities = await this.prisma.mortality.groupBy({
      by: ['dateOfDeath'],
      where: {
        farmId,
      },
      _count: {
        id: true,
      },
      orderBy: {
        dateOfDeath: 'asc',
      },
    });

    return mortalities.map((row) => ({
      date: row.dateOfDeath.toISOString().split('T')[0],
      count: row._count.id,
    }));
  }

  async getHerdStatistics(user: JwtUser) {
    const stats = await this.prisma.animal.groupBy({
      by: ['species', 'status'],
      where: { farmId: user.farmId },
      _count: { id: true },
    });

    return stats.reduce(
      (acc, row) => {
        if (!acc[row.species]) acc[row.species] = {};

        acc[row.species][row.status] = row._count.id;

        return acc;
      },
      {} as Record<Species, Partial<Record<AnimalStatus, number>>>,
    );
  }

  async getHealthAlerts(user: JwtUser) {
    return this.medicalRecords.getAlerts(user.farmId);
  }
}
