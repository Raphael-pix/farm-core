import { PrismaService } from '@/prisma/prisma.service';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RecordMortalityDto } from '../dto/record-mortality.dto';
import { QueryMortalityHistoryDto } from '../dto/query-morality.dto';

@Injectable()
export class MortalityService {
  private readonly logger = new Logger(MortalityService.name);

  constructor(private readonly prisma: PrismaService) {}

  MORTALITY_SELECT = {
    id: true,
    dateOfDeath: true,
    cause: true,
    causeDetails: true,
    location: true,
    age: true,
    postMortemNotes: true,
    bodyDisposal: true,
    recordedBy: { select: { id: true, fullName: true } },
    createdAt: true,
  } as const;

  async record(
    animalId: string,
    dto: RecordMortalityDto,
    farmId: string,
    recordedById: string,
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, farmId },
    });

    if (!animal) throw new NotFoundException(`Animal ${animalId} not found`);

    if (animal.status === 'DEAD') {
      throw new BadRequestException('Animal is already marked as dead');
    }

    const [mortality] = await this.prisma.$transaction([
      this.prisma.mortality.create({
        data: {
          farmId,
          animalId,
          dateOfDeath: new Date(dto.dateOfDeath),
          cause: dto.cause,
          causeDetails: dto.causeDetails,
          location: dto.location,
          age: dto.age,
          postMortemNotes: dto.postMortemNotes,
          bodyDisposal: dto.bodyDisposal,
          recordedById,
        },
        select: this.MORTALITY_SELECT,
      }),
      this.prisma.animal.update({
        where: { id: animalId },
        data: {
          status: 'DEAD',
          statusChangedAt: new Date(),
          statusReason: `${dto.cause}: ${dto.causeDetails || ''}`,
        },
      }),
    ]);

    this.logger.log(
      `[animalId=${animalId}] Mortality recorded: ${dto.cause} on ${dto.dateOfDeath}`,
    );

    return mortality;
  }

  async getForAnimal(animalId: string, farmId: string) {
    return this.prisma.mortality.findFirst({
      where: { animalId, farmId },
      select: this.MORTALITY_SELECT,
    });
  }

  async getHistory(query: QueryMortalityHistoryDto, farmId: string) {
    const { days = 90, page = 1, limit = 20 } = query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const skip = (page - 1) * limit;

    const [history, total] = await this.prisma.$transaction([
      this.prisma.mortality.findMany({
        where: {
          farmId,
          dateOfDeath: { gte: cutoff },
        },
        select: {
          ...this.MORTALITY_SELECT,
          animal: { select: { id: true, name: true, species: true } },
        },
        orderBy: { dateOfDeath: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mortality.count({
        where: {
          farmId,
          dateOfDeath: { gte: cutoff },
        },
      }),
    ]);

    return {
      data: history,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMortalityAnalytics(farmId: string, days = 365) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const byCause = await this.prisma.mortality.groupBy({
      by: ['cause'],
      where: { farmId, dateOfDeath: { gte: cutoff } },
      _count: { id: true },
    });

    const bySpecies = await this.prisma.mortality.groupBy({
      by: ['cause'],
      where: { farmId, dateOfDeath: { gte: cutoff } },
      _count: { id: true },
    });

    return {
      totalMortality: byCause.reduce((sum, row) => sum + row._count.id, 0),
      byCause,
      bySpecies,
    };
  }
}
