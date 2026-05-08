import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BreedingStatus } from 'generated/prisma/enums';

import { PrismaService } from '@/prisma/prisma.service';
import { CreateBreedingEventDto } from '../dto/create-breeding-event.dto';
import { QueryBreedingEventsDto } from '../dto/query-breeding-events';
import { Prisma } from 'generated/prisma/client';

const BREEDING_EVENT_SELECT = {
  id: true,
  status: true,
  plannedDate: true,
  matedDate: true,
  expectedBirthDate: true,
  actualBirthDate: true,
  numberOfOffspring: true,
  offspringNotes: true,
  notes: true,
  male: { select: { id: true, name: true, species: true } },
  female: { select: { id: true, name: true, species: true } },
  recordedBy: { select: { id: true, fullName: true } },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class BreedingService {
  private readonly logger = new Logger(BreedingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateBreedingEventDto,
    farmId: string,
    recordedById: string,
  ) {
    const [male, female] = await Promise.all([
      this.prisma.animal.findFirst({
        where: { id: dto.maleId, farmId },
      }),
      this.prisma.animal.findFirst({
        where: { id: dto.femaleId, farmId },
      }),
    ]);

    if (!male)
      throw new NotFoundException(`Male animal ${dto.maleId} not found`);
    if (!female)
      throw new NotFoundException(`Female animal ${dto.femaleId} not found`);

    if (male.sex === 'FEMALE' || female.sex === 'MALE') {
      throw new BadRequestException('Male and female animals are required');
    }

    if (male.species !== female.species) {
      throw new BadRequestException(
        'Animals must be the same species to breed',
      );
    }

    const event = await this.prisma.breedingEvent.create({
      data: {
        farmId,
        maleId: dto.maleId,
        femaleId: dto.femaleId,
        status: BreedingStatus.PLANNED,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null,
        notes: dto.notes,
        recordedById,
      },
      select: BREEDING_EVENT_SELECT,
    });

    this.logger.log(
      `[farmId=${farmId}] Breeding event created: ${male.name} x ${female.name}`,
    );

    return event;
  }

  async recordMating(eventId: string, farmId: string) {
    const event = await this.prisma.breedingEvent.findFirst({
      where: { id: eventId, farmId },
    });

    if (!event)
      throw new NotFoundException(`Breeding event ${eventId} not found`);

    if (event.status !== BreedingStatus.PLANNED) {
      throw new BadRequestException(
        `Cannot record mating for event in ${event.status} status`,
      );
    }

    const gestationDays: Record<string, number> = {
      CATTLE: 280,
      SHEEP: 150,
      GOATS: 150,
      PIGS: 114,
      OTHER: 180,
    };

    const male = await this.prisma.animal.findUnique({
      where: { id: event.maleId },
      select: { species: true },
    });

    const gestationDays_ = gestationDays[male!.species] || 180;
    const expectedBirthDate = new Date();
    expectedBirthDate.setDate(expectedBirthDate.getDate() + gestationDays_);

    const updated = await this.prisma.breedingEvent.update({
      where: { id: eventId },
      data: {
        status: BreedingStatus.MATED,
        matedDate: new Date(),
        expectedBirthDate,
      },
      select: BREEDING_EVENT_SELECT,
    });

    this.logger.log(
      `[eventId=${eventId}] Mating recorded, birth expected in ${gestationDays_} days`,
    );

    return updated;
  }

  async recordBirth(
    eventId: string,
    numberOfOffspring: number,
    offspringNotes: string,
    farmId: string,
  ) {
    const event = await this.prisma.breedingEvent.findFirst({
      where: { id: eventId, farmId },
      include: { male: true, female: true },
    });

    if (!event)
      throw new NotFoundException(`Breeding event ${eventId} not found`);

    if (event.status !== BreedingStatus.MATED) {
      throw new BadRequestException(
        `Cannot record birth for event in ${event.status} status`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.breedingEvent.update({
        where: { id: eventId },
        data: {
          status: BreedingStatus.DELIVERED,
          actualBirthDate: now,
          numberOfOffspring,
          offspringNotes,
        },
        select: BREEDING_EVENT_SELECT,
      });
      const offspringSpecies = event.male.species;
      for (let i = 0; i < numberOfOffspring; i++) {
        await tx.animal.create({
          data: {
            farmId,
            species: offspringSpecies,
            sex: 'UNKNOWN',
            dateOfBirth: now,
            maleParentId: event.maleId,
            femaleParentId: event.femaleId,
            status: 'ACTIVE',
            name: `${event.female.name} offspring ${i + 1}`,
          },
        });
      }

      return updatedEvent;
    });

    this.logger.log(
      `[eventId=${eventId}] Birth recorded: ${numberOfOffspring} offspring born`,
    );

    return updated;
  }

  async getBreedingEvents(farmId: string, query: QueryBreedingEventsDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BreedingEventWhereInput = {
      farmId,
      ...(status && { status }),
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.breedingEvent.findMany({
        where,
        skip,
        select: BREEDING_EVENT_SELECT,
      }),
      this.prisma.breedingEvent.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getParentage(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, farmId },
      select: {
        maleParent: {
          select: { id: true, name: true, species: true, dateOfBirth: true },
        },
        femaleParent: {
          select: { id: true, name: true, species: true, dateOfBirth: true },
        },
      },
    });

    if (!animal) throw new NotFoundException(`Animal ${animalId} not found`);

    return {
      sire: animal.maleParent,
      dam: animal.femaleParent,
    };
  }

  async getOffspring(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, farmId },
    });

    if (!animal) throw new NotFoundException(`Animal ${animalId} not found`);

    const [fromMale, fromFemale] = await Promise.all([
      this.prisma.animal.findMany({
        where: { maleParentId: animalId, farmId },
        select: {
          id: true,
          name: true,
          species: true,
          sex: true,
          dateOfBirth: true,
          status: true,
        },
      }),
      this.prisma.animal.findMany({
        where: { femaleParentId: animalId, farmId },
        select: {
          id: true,
          name: true,
          species: true,
          sex: true,
          dateOfBirth: true,
          status: true,
        },
      }),
    ]);

    return {
      fromSire: fromMale,
      fromDam: fromFemale,
      totalOffspring: fromMale.length + fromFemale.length,
    };
  }

  async getFamilyTree(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, farmId },
      select: {
        id: true,
        name: true,
        species: true,
      },
    });

    if (!animal) throw new NotFoundException(`Animal ${animalId} not found`);

    const parentage = await this.getParentage(animalId, farmId);
    const offspring = await this.getOffspring(animalId, farmId);

    return {
      animal,
      parentage,
      offspring,
    };
  }
}
