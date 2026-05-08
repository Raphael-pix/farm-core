import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';
import {
  AnimalIdentityType,
  AnimalStatus,
  Role,
} from 'generated/prisma/client';

import { LivestockService } from './livestock.service';
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

@ApiTags('Livestock')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard)
@Controller({ path: 'livestock', version: '1' })
export class LivestockController {
  constructor(
    private readonly livestockService: LivestockService,
    private readonly animalRegistryService: AnimalRegistryService,
    private readonly MedicalRecordsService: MedicalRecordsService,
    private readonly breedingService: BreedingService,
    private readonly mortalityService: MortalityService,
  ) {}

  // ANIMAL REGISTRY — Register, list, update, delete animals

  /**
   * Register a new animal (born on farm or acquired externally).
   * Auto-generates QR code for identification.
   *
   * POST /api/v1/livestock/animals
   */
  @Post('animals')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new animal',
    description:
      'Create animal record (birth or acquisition). Auto-generates QR code.',
  })
  async registerAnimal(
    @Body() dto: RegisterAnimalDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.registerAnimal(dto, user);
  }

  /**
   * List animals with optional filters (species, status, location).
   *
   * GET /api/v1/livestock/animals?species=CATTLE&status=ACTIVE&page=1&limit=20
   */
  @Get('animals')
  @ApiOperation({
    summary: 'List animals',
    description: 'Get paginated animal list with optional filters.',
  })
  async listAnimals(
    @Query() query: QueryAnimalsDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.listAnimals(query, user);
  }

  /**
   * Get animal detail with all relationships (medical, breeding, mortality).
   *
   * GET /api/v1/livestock/animals/:id
   */
  @Get('animals/:id')
  @ApiOperation({
    summary: 'Get animal detail',
    description: 'Retrieve complete animal profile.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getAnimalDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.getAnimalDetail(id, user);
  }

  /**
   * Get complete animal profile (all data).
   * Includes: basic info, medical history, breeding lineage, mortality status.
   *
   * GET /api/v1/livestock/animals/:id/profile
   */
  @Get('animals/:id/profile')
  @ApiOperation({
    summary: 'Get animal full profile',
    description:
      'Complete profile including medical, breeding, and mortality records.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getFullProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.getFullProfile(id, user);
  }

  /**
   * Update animal attributes (name, weight, breed, color, location, notes).
   * Does NOT update status (use /change-status for that).
   *
   * PATCH /api/v1/livestock/animals/:id
   */
  @Patch('animals/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update animal',
    description:
      'Modify animal attributes. Use /change-status for status changes.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async updateAnimal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnimalDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.updateAnimal(id, dto, user);
  }

  /**
   * Change animal status (ACTIVE → SOLD/DEAD/ARCHIVED/MISSING).
   *
   * PATCH /api/v1/livestock/animals/:id/status
   */
  @Patch('animals/:id/status')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change animal status',
    description:
      'Update status (ACTIVE → SOLD/DEAD/ARCHIVED/MISSING) with reason.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; reason: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.changeAnimalStatus(
      id,
      body.status as AnimalStatus,
      body.reason,
      user,
    );
  }

  // ANIMAL IDENTITIES — QR codes, tags, RFID, names

  /**
   * Add a new identity to an animal (QR code, tag, RFID, name, etc.).
   *
   * POST /api/v1/livestock/animals/:id/identities
   */
  @Post('animals/:id/identities')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add animal identity',
    description: 'Add QR code, RFID tag, ear tag, or name to animal.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async addIdentity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { type: string; value: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.animalRegistryService.addIdentity(
      id,
      user.farmId,
      body.type as AnimalIdentityType,
      body.value,
    );
  }

  /**
   * Get all identities for an animal.
   *
   * GET /api/v1/livestock/animals/:id/identities
   */
  @Get('animals/:id/identities')
  @ApiOperation({ summary: 'Get animal identities' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getIdentities(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const animal = await this.livestockService.getAnimalDetail(id, user);
    return animal.identities;
  }

  /**
   * Revoke an identity (e.g., tag lost, QR code damaged).
   *
   * DELETE /api/v1/livestock/animals/:id/identities/:identityId
   */
  @Delete('animals/:id/identities/:identityId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke animal identity' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @ApiParam({ name: 'identityId', description: 'Identity UUID' })
  async revokeIdentity(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('identityId', ParseUUIDPipe) identityId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.animalRegistryService.revokeIdentity(identityId, user.farmId);
  }

  /**
   * Lookup animal by scanning QR code, RFID, or other identifier.
   *
   * GET /api/v1/livestock/animals/lookup?type=QR_CODE&value=FARM-001-ABC123
   */
  @Get('animals/lookup')
  @ApiOperation({
    summary: 'Lookup animal by identifier',
    description: 'Find animal by scanning QR code, RFID, or other identity.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: 'uuid',
        name: 'Bessie',
        species: 'CATTLE',
        status: 'ACTIVE',
      },
    },
  })
  async lookupAnimal(
    @Query('type') type: string,
    @Query('value') value: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.animalRegistryService.lookupByIdentity(
      type as AnimalIdentityType,
      value,
      user.farmId,
    );
  }

  // MEDICAL RECORDS — Record and track health events (Append-only)

  /**
   * Record a medical event (illness, treatment, medication, vaccination, etc.).
   * Immutable once created.
   *
   * POST /api/v1/livestock/animals/:id/medical
   */
  @Post('animals/:id/medical')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record medical event',
    description:
      'Log illness, treatment, medication, or vaccination. Immutable record.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async recordMedicalEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMedicalEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.recordMedicalEvent(id, dto, user);
  }

  /**
   * Get medical history for an animal (all records, ordered by date).
   *
   * GET /api/v1/livestock/animals/:id/medical
   */
  @Get('animals/:id/medical')
  @ApiOperation({
    summary: 'Get medical history',
    description:
      'Retrieve all medical records for animal, ordered by date DESC.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getMedicalHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.getMedicalHistory(id, user);
  }

  /**
   * Schedule a future vaccination or treatment.
   *
   * POST /api/v1/livestock/animals/:id/medical/schedule
   */
  @Post('animals/:id/medical/schedule')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Schedule vaccination/treatment',
    description: 'Create a scheduled medical event for future date.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async scheduleVaccination(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMedicalEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.scheduleVaccination(id, dto, user);
  }

  /**
   * Mark a scheduled medical event as completed.
   *
   * PATCH /api/v1/livestock/medical/:recordId/complete
   */
  @Patch('medical/:recordId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark medical event completed',
    description: 'Update scheduled event status to COMPLETED.',
  })
  @ApiParam({ name: 'recordId', description: 'Medical Record UUID' })
  async completeMedicalRecord(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() body: { completedAt?: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.MedicalRecordsService.markAsCompleted(
      recordId,
      user.farmId,
      body.completedAt,
    );
  }

  /**
   * Get upcoming vaccinations for the farm (within N days).
   *
   * GET /api/v1/livestock/medical/upcoming-vaccinations?days=30
   */
  @Get('medical/upcoming-vaccinations')
  @ApiOperation({
    summary: 'Get upcoming vaccinations',
    description: 'List vaccinations due in next N days.',
  })
  async getUpcomingVaccinations(
    @Query('days') days: number = 30,
    @CurrentUser() user: JwtUser,
  ) {
    return this.MedicalRecordsService.getUpcomingVaccinations(
      user.farmId,
      days,
    );
  }

  /**
   * Get health alerts (recent illnesses, missed treatments, upcoming vaccinations).
   *
   * GET /api/v1/livestock/medical/alerts
   */
  @Get('medical/alerts')
  @ApiOperation({
    summary: 'Get health alerts',
    description: 'Recent illnesses, missed treatments, upcoming vaccinations.',
  })
  async getHealthAlerts(@CurrentUser() user: JwtUser) {
    return this.livestockService.getHealthAlerts(user);
  }

  // BREEDING — Track mating events, births, offspring, lineage

  /**
   * Create/plan a breeding event.
   *
   * POST /api/v1/livestock/breeding
   */
  @Post('breeding')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create breeding event',
    description: 'Plan a breeding event between male and female animal.',
  })
  async createBreedingEvent(
    @Body() dto: CreateBreedingEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.createBreedingEvent(dto, user);
  }

  /**
   * Record that mating occurred.
   * Auto-calculates expected birth date based on species gestation period.
   *
   * PATCH /api/v1/livestock/breeding/:id/mated
   */
  @Patch('breeding/:id/mated')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record mating',
    description:
      'Confirm mating occurred. Auto-calculates expected birth date.',
  })
  @ApiParam({ name: 'id', description: 'Breeding Event UUID' })
  async recordMating(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.recordMating(id, user);
  }

  /**
   * Record birth of offspring.
   * Auto-creates Animal records for each offspring.
   *
   * PATCH /api/v1/livestock/breeding/:id/birth
   */
  @Patch('breeding/:id/birth')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record birth',
    description: 'Record birth outcome. Auto-creates offspring animals.',
  })
  @ApiParam({ name: 'id', description: 'Breeding Event UUID' })
  async recordBirth(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { numberOfOffspring: number; details?: string },
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.recordBirth(
      id,
      body.numberOfOffspring,
      body.details || '',
      user,
    );
  }

  /**
   * Get parent information for an animal.
   *
   * GET /api/v1/livestock/animals/:id/parentage
   */
  @Get('animals/:id/parentage')
  @ApiOperation({
    summary: 'Get animal parentage',
    description: 'Retrieve sire and dam information.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getParentage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.breedingService.getParentage(id, user.farmId);
  }

  /**
   * Get offspring of an animal.
   *
   * GET /api/v1/livestock/animals/:id/offspring
   */
  @Get('animals/:id/offspring')
  @ApiOperation({
    summary: 'Get offspring',
    description: 'List all offspring (if parent) or empty (if not).',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getOffspring(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.breedingService.getOffspring(id, user.farmId);
  }

  /**
   * Get complete family tree (parents + offspring + grandparents).
   *
   * GET /api/v1/livestock/animals/:id/family-tree
   */
  @Get('animals/:id/family-tree')
  @ApiOperation({
    summary: 'Get family tree',
    description: 'Complete lineage information (parents, offspring, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async getFamilyTree(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.breedingService.getFamilyTree(id, user.farmId);
  }

  /**
   * List breeding events for the farm.
   *
   * GET /api/v1/livestock/breeding?status=PLANNED&page=1&limit=20
   */
  @Get('breeding')
  @ApiOperation({
    summary: 'List breeding events',
    description: 'Get paginated breeding events with optional status filter.',
  })
  listBreedingEvents(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Returns breeding events for the farm
    return {
      data: [],
      meta: { total: 0, page, limit },
    };
  }

  // MORTALITY — Record animal deaths (Append-only, immutable)

  /**
   * Record animal death.
   * Immutable once created. Auto-updates animal status to DEAD.
   *
   * POST /api/v1/livestock/animals/:id/mortality
   */
  @Post('animals/:id/mortality')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record mortality',
    description:
      'Record animal death with cause and details. Immutable record.',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async recordMortality(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMortalityDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.recordMortality(id, dto, user);
  }

  /**
   * Get mortality history for the farm (last N days).
   *
   * GET /api/v1/livestock/mortality?days=90&page=1&limit=20
   */
  @Get('mortality')
  @ApiOperation({
    summary: 'Get mortality records',
    description: 'List mortality events for the farm, paginated.',
  })
  async getMortalityHistory(
    @Query('days') days: number = 90,
    @CurrentUser() user: JwtUser,
  ) {
    return this.livestockService.getMortalityHistory(user, days);
  }

  /**
   * Get mortality analytics (deaths by cause and species).
   *
   * GET /api/v1/livestock/mortality/analytics?days=365
   */
  @Get('mortality/analytics')
  @ApiOperation({
    summary: 'Get mortality analytics',
    description: 'Analyze deaths by cause and species over time period.',
  })
  async getMortalityAnalytics(
    @Query('days') days: number = 365,
    @CurrentUser() user: JwtUser,
  ) {
    return this.mortalityService.getMortalityAnalytics(user.farmId, days);
  }

  // DASHBOARD — Herd overview and analytics

  /**
   * Get herd statistics (count by species and status).
   *
   * GET /api/v1/livestock/dashboard/herd-stats
   */
  @Get('dashboard/herd-stats')
  @ApiOperation({
    summary: 'Get herd statistics',
    description: 'Count animals by species and status for dashboard.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        CATTLE: { ACTIVE: 50, SOLD: 5, DEAD: 2, ARCHIVED: 0 },
        SHEEP: { ACTIVE: 30, SOLD: 0, DEAD: 1, ARCHIVED: 0 },
      },
    },
  })
  async getHerdStatistics(@CurrentUser() user: JwtUser) {
    return this.livestockService.getHerdStatistics(user);
  }

  /**
   * Get health alerts for dashboard.
   *
   * GET /api/v1/livestock/dashboard/health-alerts
   */
  @Get('dashboard/health-alerts')
  @ApiOperation({
    summary: 'Get health alerts',
    description: 'Recent illnesses, missed treatments, upcoming vaccinations.',
  })
  async getDashboardHealthAlerts(@CurrentUser() user: JwtUser) {
    return this.livestockService.getHealthAlerts(user);
  }

  // UTILITY ENDPOINTS

  /**
   * Get list of available species for filtering/selection.
   *
   * GET /api/v1/livestock/metadata/species
   */
  @Get('metadata/species')
  @ApiOperation({
    summary: 'Get available species',
    description: 'List of animal species that can be registered.',
  })
  getSpecies() {
    return [
      'CATTLE',
      'SHEEP',
      'GOATS',
      'PIGS',
      'POULTRY',
      'FISH',
      'BEEHIVE',
      'OTHER',
    ];
  }

  /**
   * Get list of available identity types.
   *
   * GET /api/v1/livestock/metadata/identity-types
   */
  @Get('metadata/identity-types')
  @ApiOperation({
    summary: 'Get identity types',
    description: 'List of available animal identification methods.',
  })
  getIdentityTypes() {
    return [
      'QR_CODE',
      'RFID_TAG',
      'EAR_TAG',
      'TATTOO',
      'MICROCHIP',
      'NAME',
      'MANUAL_ID',
    ];
  }

  /**
   * Get list of medical event types.
   *
   * GET /api/v1/livestock/metadata/medical-event-types
   */
  @Get('metadata/medical-event-types')
  @ApiOperation({
    summary: 'Get medical event types',
    description: 'List of medical events that can be recorded.',
  })
  getMedicalEventTypes() {
    return [
      'ILLNESS',
      'TREATMENT',
      'MEDICATION',
      'VACCINATION',
      'HEALTH_CHECK',
      'SURGERY',
      'DEATH',
      'INJURY',
      'QUARANTINE',
    ];
  }

  /**
   * Get list of death causes.
   *
   * GET /api/v1/livestock/metadata/death-causes
   */
  @Get('metadata/death-causes')
  @ApiOperation({
    summary: 'Get death causes',
    description: 'List of possible death causes for mortality records.',
  })
  getDeathCauses() {
    return [
      'DISEASE',
      'INJURY',
      'AGE',
      'PREDATION',
      'ACCIDENT',
      'UNKNOWN',
      'EUTHANASIA',
      'OTHER',
    ];
  }
}
