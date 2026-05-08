import { Injectable, Logger } from '@nestjs/common';
import { AnimalStatus } from 'generated/prisma/enums';

import { JwtUser } from '@/auth/types/request-user.type';

import { RegisterAnimalDto } from './dto/register-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { RecordMedicalEventDto } from './dto/record-medical-event.dto';
import { RecordMortalityDto } from './dto/record-mortality.dto';
import { CreateBreedingEventDto } from './dto/create-breeding-event.dto';
import { QueryAnimalsDto } from './dto/query-animals.dto';

import { AnimalRegistryService } from './services/animal-registry.service';
import { MedicalRecordsService } from './services/medical-records.service';
import { BreedingService } from './services/breeding.service';
import { MortalityService } from './services/mortality.service';
import { QueryMedicalHistoryDto } from './dto/query-medical-history.dto';
import { QueryMortalityHistoryDto } from './dto/query-morality.dto';

@Injectable()
export class LivestockService {
  private readonly logger = new Logger(LivestockService.name);

  constructor(
    private readonly animalRegistry: AnimalRegistryService,
    private readonly medicalRecords: MedicalRecordsService,
    private readonly breeding: BreedingService,
    private readonly mortality: MortalityService,
  ) {}

  async registerAnimal(dto: RegisterAnimalDto, user: JwtUser) {
    return this.animalRegistry.register(dto, user.farmId, user.id);
  }

  async listAnimals(query: QueryAnimalsDto, user: JwtUser) {
    return this.animalRegistry.list(query, user.farmId);
  }

  async getAnimalDetail(id: string, JwtUser: JwtUser) {
    return this.animalRegistry.getDetail(id, JwtUser.farmId);
  }

  async updateAnimal(id: string, dto: UpdateAnimalDto, user: JwtUser) {
    return this.animalRegistry.update(id, dto, user.farmId, user.id);
  }

  async changeAnimalStatus(
    id: string,
    user: JwtUser,
    status: AnimalStatus,
    reason?: string,
  ) {
    return this.animalRegistry.changeStatus(
      id,
      status,
      user.farmId,
      user.id,
      reason,
    );
  }

  async recordMedicalEvent(
    animalId: string,
    dto: RecordMedicalEventDto,
    user: JwtUser,
  ) {
    const medical = await this.medicalRecords.record(
      animalId,
      dto,
      user.farmId,
      user.id,
    );
    return medical;
  }

  async getFullMedicalHistory(user: JwtUser, query: QueryMedicalHistoryDto) {
    return this.medicalRecords.getFullHistory(user.farmId, query);
  }

  async getMedicalHistory(animalId: string, user: JwtUser) {
    return this.medicalRecords.getHistory(animalId, user.farmId);
  }

  async scheduleVaccination(
    animalId: string,
    dto: RecordMedicalEventDto,
    user: JwtUser,
  ) {
    return this.medicalRecords.schedule(animalId, dto, user.farmId, user.id);
  }

  async createBreedingEvent(dto: CreateBreedingEventDto, user: JwtUser) {
    return this.breeding.create(dto, user.farmId, user.id);
  }

  async recordMating(eventId: string, user: JwtUser) {
    return this.breeding.recordMating(eventId, user.farmId);
  }

  async recordBirth(
    eventId: string,
    numberOfOffspring: number,
    details: string,
    user: JwtUser,
  ) {
    return this.breeding.recordBirth(
      eventId,
      numberOfOffspring,
      details,
      user.farmId,
    );
  }

  async recordMortality(
    animalId: string,
    dto: RecordMortalityDto,
    user: JwtUser,
  ) {
    return this.mortality.record(animalId, dto, user.farmId, user.id);
  }

  async getMortalityHistory(query: QueryMortalityHistoryDto, user: JwtUser) {
    return this.mortality.getHistory(query, user.farmId);
  }

  async getFullProfile(id: string, user: JwtUser) {
    const animal = await this.animalRegistry.getDetail(id, user.farmId);
    const medical = await this.medicalRecords.getHistory(id, user.farmId);
    const parents = await this.breeding.getParentage(id, user.farmId);
    const offspring = await this.breeding.getOffspring(id, user.farmId);
    const mortality = await this.mortality.getForAnimal(id, user.farmId);

    return {
      animal,
      medical,
      parents,
      offspring,
      mortality,
      lineage: { parents, offspring },
    };
  }
}
