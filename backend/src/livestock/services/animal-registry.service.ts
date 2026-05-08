import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AnimalIdentityType, AnimalStatus } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

import { PrismaService } from '@/prisma/prisma.service';
import { RegisterAnimalDto } from '../dto/register-animal.dto';
import { UpdateAnimalDto } from '../dto/update-animal.dto';
import { QueryAnimalsDto } from '../dto/query-animals.dto';

const ANIMAL_SELECT = {
  id: true,
  farmId: true,
  name: true,
  species: true,
  breed: true,
  sex: true,
  dateOfBirth: true,
  acquiredDate: true,
  status: true,
  statusChangedAt: true,
  statusReason: true,
  color: true,
  weight: true,
  height: true,
  location: { select: { id: true, county: true, subCounty: true, ward: true } },
  maleParentId: true,
  femaleParentId: true,
  identities: {
    where: { isActive: true },
    select: { id: true, type: true, value: true },
  },
  _count: {
    select: { medicalRecords: true, breedingEvents: true, mortalities: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AnimalRegistryService {
  private readonly logger = new Logger(AnimalRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterAnimalDto, farmId: string, createdById: string) {
    if (dto.maleParentId || dto.femaleParentId) {
      if (dto.maleParentId) {
        const maleParent = await this.prisma.animal.findFirst({
          where: { id: dto.maleParentId, farmId },
        });
        if (!maleParent)
          throw new BadRequestException('Male parent not found in this farm');
      }
      if (dto.femaleParentId) {
        const femaleParent = await this.prisma.animal.findFirst({
          where: { id: dto.femaleParentId, farmId },
        });
        if (!femaleParent)
          throw new BadRequestException('Female parent not found in this farm');
      }
    }

    const animal = await this.prisma.$transaction(async (tx) => {
      const newAnimal = await tx.animal.create({
        data: {
          farmId,
          name: dto.name,
          species: dto.species,
          breed: dto.breed,
          sex: dto.sex,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          acquiredDate: dto.acquiredDate ? new Date(dto.acquiredDate) : null,
          color: dto.color,
          weight: dto.weight,
          height: dto.height,
          locationId: dto.locationId,
          maleParentId: dto.maleParentId,
          femaleParentId: dto.femaleParentId,
          createdById,
          notes: dto.notes,
        },
        select: ANIMAL_SELECT,
      });

      const qrCode = `${farmId.slice(0, 8)}-${dto.species.slice(0, 3)}-${nanoid(8)}`;
      await tx.animalIdentity.create({
        data: {
          farmId,
          animalId: newAnimal.id,
          type: 'QR_CODE',
          value: qrCode,
          issuedAt: new Date(),
        },
      });

      return newAnimal;
    });

    this.logger.log(`[farmId=${farmId}] Registered animal: ${animal.id}`);
    return animal;
  }

  async list(query: QueryAnimalsDto, farmId: string) {
    const {
      species,
      status,
      location,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnimalWhereInput = {
      farmId,
      ...(species && { species }),
      ...(status && { status }),
      ...(location && {
        location: { county: { contains: location, mode: 'insensitive' } },
      }),
    };

    const [animals, total] = await this.prisma.$transaction([
      this.prisma.animal.findMany({
        where,
        select: ANIMAL_SELECT,
        skip,
        take: limit,
        orderBy: { [sortBy]: 'desc' },
      }),
      this.prisma.animal.count({ where }),
    ]);

    return {
      data: animals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDetail(id: string, farmId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id, farmId },
      select: ANIMAL_SELECT,
    });

    if (!animal) throw new NotFoundException(`Animal ${id} not found`);
    return animal;
  }

  async update(
    id: string,
    dto: UpdateAnimalDto,
    farmId: string,
    updatedById: string,
  ) {
    await this.getDetail(id, farmId);

    const updated = await this.prisma.animal.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.breed !== undefined && { breed: dto.breed }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...(dto.locationId !== undefined && { locationId: dto.locationId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedById,
      },
      select: ANIMAL_SELECT,
    });

    return updated;
  }

  async changeStatus(
    id: string,
    newStatus: AnimalStatus,
    farmId: string,
    updatedById: string,
    reason?: string,
  ) {
    const animal = await this.getDetail(id, farmId);

    if (animal.status === newStatus) {
      throw new BadRequestException(`Animal already in ${newStatus} status`);
    }

    const updated = await this.prisma.animal.update({
      where: { id },
      data: {
        status: newStatus,
        statusChangedAt: new Date(),
        statusReason: reason,
        updatedById,
      },
      select: ANIMAL_SELECT,
    });

    this.logger.log(
      `[animalId=${id}] Status changed: ${animal.status} → ${newStatus} (${reason})`,
    );

    // Trigger notification (handled by notification service)
    // Future: Notify admins of major status changes

    return updated;
  }

  async addIdentity(
    animalId: string,
    farmId: string,
    type: AnimalIdentityType,
    value: string,
  ) {
    await this.getDetail(animalId, farmId);

    const existing = await this.prisma.animalIdentity.findFirst({
      where: { farmId, type, value, isActive: true },
    });

    if (existing && existing.animalId !== animalId) {
      throw new ConflictException(
        `${type} "${value}" is already assigned to another animal in this farm`,
      );
    }

    return this.prisma.animalIdentity.create({
      data: {
        farmId,
        animalId,
        type,
        value,
        issuedAt: new Date(),
      },
    });
  }

  async revokeIdentity(identityId: string, farmId: string) {
    const identity = await this.prisma.animalIdentity.findFirst({
      where: { id: identityId, farmId },
    });

    if (!identity) throw new NotFoundException('Identity not found');

    return this.prisma.animalIdentity.update({
      where: { id: identityId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async lookupByIdentity(
    type: AnimalIdentityType,
    value: string,
    farmId: string,
  ) {
    const identity = await this.prisma.animalIdentity.findFirst({
      where: { farmId, type, value, isActive: true },
      include: { animal: { select: ANIMAL_SELECT } },
    });

    if (!identity) throw new NotFoundException(`${type} "${value}" not found`);
    return identity.animal;
  }

  calculateAge(
    dateOfBirth: Date | null,
  ): { years: number; months: number } | null {
    if (!dateOfBirth) return null;
    const now = dayjs();
    const birth = dayjs(dateOfBirth);
    const years = now.diff(birth, 'year');
    const months = now.diff(birth.add(years, 'year'), 'month');
    return { years, months };
  }
}
