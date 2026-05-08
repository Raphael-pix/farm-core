import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MedicalStatus } from 'generated/prisma/enums';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { RecordMedicalEventDto } from '../dto/record-medical-event.dto';
import { QueryMedicalHistoryDto } from '../dto/query-medical-history.dto';
import { Prisma } from 'generated/prisma/client';

const MEDICAL_RECORD_SELECT = {
  id: true,
  type: true,
  status: true,
  title: true,
  description: true,
  diagnosis: true,
  treatment: true,
  medication: true,
  dosage: true,
  doseUnit: true,
  frequency: true,
  duration: true,
  veterinarianName: true,
  clinicName: true,
  scheduledFor: true,
  completedAt: true,
  estimatedCost: true,
  actualCost: true,
  notes: true,
  recordedBy: { select: { id: true, fullName: true, email: true } },
  animal: { select: { id: true, name: true } },
  createdAt: true,
} as const;

@Injectable()
export class MedicalRecordsService {
  private readonly logger = new Logger(MedicalRecordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(
    animalId: string,
    dto: RecordMedicalEventDto,
    farmId: string,
    recordedById: string,
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, farmId },
    });
    if (!animal) throw new NotFoundException(`Animal ${animalId} not found`);

    const record = await this.prisma.medicalRecord.create({
      data: {
        farmId,
        animalId,
        type: dto.type,
        status: dto.status || MedicalStatus.COMPLETED,
        title: dto.title,
        description: dto.description,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        medication: dto.medication,
        dosage: dto.dosage,
        doseUnit: dto.doseUnit,
        frequency: dto.frequency,
        duration: dto.duration,
        veterinarianName: dto.veterinarianName,
        clinicName: dto.clinicName,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        estimatedCost: dto.estimatedCost,
        actualCost: dto.actualCost,
        notes: dto.notes,
        recordedById,
      },
      select: MEDICAL_RECORD_SELECT,
    });

    this.logger.log(
      `[animalId=${animalId}] Medical record created: ${record.id} (${record.type})`,
    );

    return record;
  }

  async getHistory(animalId: string, farmId: string, limit = 100) {
    const records = await this.prisma.medicalRecord.findMany({
      where: { animalId, farmId },
      select: MEDICAL_RECORD_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (records.length === 0) {
      this.logger.debug(`[animalId=${animalId}] No medical history found`);
    }

    return records;
  }

  async getFullHistory(farmId: string, query: QueryMedicalHistoryDto) {
    const { status, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicalRecordWhereInput = {
      farmId,
      ...(type && { type }),
      ...(status && { status }),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.medicalRecord.findMany({
        where,
        select: MEDICAL_RECORD_SELECT,
        skip,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.medicalRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async schedule(
    animalId: string,
    dto: RecordMedicalEventDto,
    farmId: string,
    recordedById: string,
  ) {
    if (!dto.scheduledFor) {
      throw new BadRequestException('scheduledFor is required for scheduling');
    }

    const scheduledDate = dayjs(dto.scheduledFor).toDate();
    if (dayjs(scheduledDate).isBefore(dayjs())) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    return this.record(
      animalId,
      {
        ...dto,
        status: MedicalStatus.SCHEDULED,
      },
      farmId,
      recordedById,
    );
  }

  async markAsCompleted(
    recordId: string,
    farmId: string,
    completedAt?: string,
  ) {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id: recordId, farmId },
    });

    if (!record)
      throw new NotFoundException(`Medical record ${recordId} not found`);

    if (record.status !== MedicalStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot mark non-scheduled record as completed (current: ${record.status})`,
      );
    }

    const updated = await this.prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        status: MedicalStatus.COMPLETED,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
      select: MEDICAL_RECORD_SELECT,
    });

    this.logger.log(`[recordId=${recordId}] Medical event completed`);
    return updated;
  }

  async getUpcomingVaccinations(farmId: string, daysAhead = 30) {
    const cutoff = dayjs().add(daysAhead, 'day').toDate();

    return this.prisma.medicalRecord.findMany({
      where: {
        farmId,
        type: 'VACCINATION',
        status: MedicalStatus.SCHEDULED,
        scheduledFor: {
          gte: new Date(),
          lte: cutoff,
        },
      },
      select: {
        ...MEDICAL_RECORD_SELECT,
        animal: {
          select: { id: true, name: true, species: true },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async getAlerts(farmId: string) {
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
            id: true,
            type: true,
            diagnosis: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),

        this.prisma.medicalRecord.findMany({
          where: {
            farmId,
            status: MedicalStatus.MISSED,
          },
          select: {
            id: true,
            animal: { select: { id: true, name: true, species: true } },
            type: true,
            title: true,
            scheduledFor: true,
          },
          take: 20,
        }),

        this.getUpcomingVaccinations(farmId, 7),
      ]);

    return {
      recentIllnesses,
      missedTreatments,
      upcomingVaccinations,
      alertCount:
        recentIllnesses.length +
        missedTreatments.length +
        upcomingVaccinations.length,
    };
  }

  async getVeterinaryCosts(farmId: string, fromDate: Date, toDate: Date) {
    const records = await this.prisma.medicalRecord.groupBy({
      by: ['type'],
      where: {
        farmId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      _sum: { actualCost: true, estimatedCost: true },
      _count: { id: true },
    });

    return records.map((row) => ({
      type: row.type,
      count: row._count.id,
      totalActualCost: row._sum.actualCost || 0,
      totalEstimatedCost: row._sum.estimatedCost || 0,
    }));
  }
}
