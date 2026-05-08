import { apiClient } from '@/lib/apiClient'
import type {
  Animal,
  AnimalIdentity,
  AnimalProfile,
  BreedingEvent,
  HealthAlerts,
  HerdStats,
  MedicalRecord,
  Mortality,
  PaginatedResponse,
} from '@/types/api.types'

export const livestockSerivce = {
  async registerAnimal(input: RegisterAnimalInput) {
    const { data } = await apiClient.post<Animal>('/livestock/animals', input)
    return data
  },
  async listAnimals(
    params?: AnimalListParams,
  ): Promise<PaginatedResponse<Animal>> {
    const { data } = await apiClient.get('/livestock/animals', { params })
    return data
  },

  async getAnimal(id: string): Promise<Animal> {
    const { data } = await apiClient.get(`/livestock//animals/${id}`)
    return data
  },
  async getAnimalProfile(id: string): Promise<AnimalProfile> {
    const { data } = await apiClient.get(`/livestock/animals/${id}/profile`)
    return data
  },
  async updateAnimal(id: string, updates: UpdateAnimalInput): Promise<Animal> {
    const { data } = await apiClient.patch(`/livestock/animals/${id}`, updates)
    return data
  },
  async changeStatus(
    id: string,
    status: string,
    reason: string,
  ): Promise<Animal> {
    const { data } = await apiClient.patch(`/livestock/animals/${id}/status`, {
      status,
      reason,
    })
    return data
  },
  async lookupAnimal(type: string, value: string): Promise<Animal> {
    const { data } = await apiClient.get('/livestock/animals/lookup', {
      params: { type, value },
    })
    return data
  },
  async addIdentity(
    animalId: string,
    type: string,
    value: string,
  ): Promise<AnimalIdentity> {
    const { data } = await apiClient.post(
      `/livestock/animals/${animalId}/identities`,
      {
        type,
        value,
      },
    )
    return data
  },
  async revokeIdentity(animalId: string, identityId: string): Promise<void> {
    await apiClient.delete(
      `/livestock/animals/${animalId}/identities/${identityId}`,
    )
  },
  async recordMedical(
    animalId: string,
    data: RecordMedicalInput,
  ): Promise<MedicalRecord> {
    const { data: response } = await apiClient.post(
      `/livestock/animals/${animalId}/medical`,
      data,
    )
    return response
  },
  async getMedicalHistory(animalId: string): Promise<MedicalRecord[]> {
    const { data } = await apiClient.get(
      `/livestock/animals/${animalId}/medical`,
    )
    return data
  },
  async scheduleVaccination(
    animalId: string,
    data: {
      title: string
      medication?: string
      dosage?: number
      scheduledFor: string
      notes?: string
    },
  ): Promise<MedicalRecord> {
    const { data: response } = await apiClient.post(
      `/livestock/animals/${animalId}/medical/schedule`,
      {
        type: 'VACCINATION',
        status: 'SCHEDULED',
        ...data,
      },
    )
    return response
  },
  async completeMedicalRecord(
    recordId: string,
    completedAt?: string,
  ): Promise<MedicalRecord> {
    const { data } = await apiClient.patch(
      `/livestock/medical/${recordId}/complete`,
      {
        completedAt,
      },
    )
    return data
  },
  async getUpcomingVaccinations(days?: number): Promise<MedicalRecord[]> {
    const { data } = await apiClient.get(
      '/livestock/medical/upcoming-vaccinations',
      {
        params: { days },
      },
    )
    return data
  },
  async getHealthAlerts(): Promise<HealthAlerts> {
    const { data } = await apiClient.get('/livestock/medical/alerts')
    return data
  },
  async createBreedingEvent(data: {
    maleId: string
    femaleId: string
    plannedDate?: string
    notes?: string
  }): Promise<BreedingEvent> {
    const { data: response } = await apiClient.post('/livestock/breeding', data)
    return response
  },
  async recordMating(eventId: string): Promise<BreedingEvent> {
    const { data } = await apiClient.patch(
      `/livestock/breeding/${eventId}/mated`,
    )
    return data
  },
  async recordBirth(
    eventId: string,
    numberOfOffspring: number,
    details?: string,
  ): Promise<BreedingEvent> {
    const { data } = await apiClient.patch(
      `/livestock/breeding/${eventId}/birth`,
      {
        numberOfOffspring,
        details,
      },
    )
    return data
  },
  async getParentage(
    animalId: string,
  ): Promise<{ sire?: Partial<Animal>; dam?: Partial<Animal> }> {
    const { data } = await apiClient.get(
      `/livestock/animals/${animalId}/parentage`,
    )
    return data
  },
  async getOffspring(animalId: string): Promise<{
    fromSire: Animal[]
    fromDam: Animal[]
    totalOffspring: number
  }> {
    const { data } = await apiClient.get(
      `/livestock/animals/${animalId}/offspring`,
    )
    return data
  },
  async getFamilyTree(animalId: string): Promise<AnimalProfile> {
    const { data } = await apiClient.get(
      `/livestock/animals/${animalId}/family-tree`,
    )
    return data
  },
  async recordMortality(
    animalId: string,
    data: {
      dateOfDeath: string
      cause: string
      causeDetails?: string
      location?: string
      age?: string
      postMortemNotes?: string
      bodyDisposal?: string
    },
  ): Promise<Mortality> {
    const { data: response } = await apiClient.post(
      `/livestock/animals/${animalId}/mortality`,
      data,
    )
    return response
  },
  async getMortalityHistory(params?: {
    days?: number
    page?: number
    limit?: number
  }): Promise<{ data: Mortality[]; meta: any }> {
    const { data } = await apiClient.get('/livestock/mortality', { params })
    return data
  },
  async getMortalityAnalytics(days?: number): Promise<any> {
    const { data } = await apiClient.get('/livestock/mortality/analytics', {
      params: { days },
    })
    return data
  },
  async getHerdStats(): Promise<HerdStats> {
    const { data } = await apiClient.get('/livestock/dashboard/herd-stats')
    return data
  },
  async getHealthAlertsSummary(): Promise<HealthAlerts> {
    const { data } = await apiClient.get('/livestock/dashboard/health-alerts')
    return data
  },
  async getSpecies(): Promise<string[]> {
    const { data } = await apiClient.get('/livestock/metadata/species')
    return data
  },
  async getIdentityTypes(): Promise<string[]> {
    const { data } = await apiClient.get('/livestock/metadata/identity-types')
    return data
  },
  async getMedicalEventTypes(): Promise<string[]> {
    const { data } = await apiClient.get(
      '/livestock/metadata/medical-event-types',
    )
    return data
  },
  async getDeathCauses(): Promise<string[]> {
    const { data } = await apiClient.get('/livestock/metadata/death-causes')
    return data
  },
}

export interface RegisterAnimalInput {
  name?: string
  species: string
  breed?: string
  sex: string
  dateOfBirth?: string
  acquiredDate?: string
  color?: string
  weight?: number
  height?: number
  locationId?: string
  maleParentId?: string
  femaleParentId?: string
  notes?: string
}

export interface UpdateAnimalInput {
  name?: string
  breed?: string
  color?: string
  weight?: number
  height?: number
  locationId?: string
  notes?: string
}

export interface AnimalListParams {
  species?: string
  status?: string
  location?: string
  page?: number
  limit?: number
  sortBy?: string
}

export interface RecordMedicalInput {
  type: string
  title: string
  status?: string
  description?: string
  diagnosis?: string
  treatment?: string
  medication?: string
  dosage?: number
  doseUnit?: string
  frequency?: string
  duration?: string
  veterinarianName?: string
  clinicName?: string
  scheduledFor?: string
  completedAt?: string
  estimatedCost?: number
  actualCost?: number
  notes?: string
}
