export type Role = 'ADMIN' | 'AGENT'
export type CropStage = 'PLANTED' | 'GROWING' | 'READY' | 'HARVESTED'
export type FieldStatus = 'ACTIVE' | 'AT_RISK' | 'COMPLETED'

export interface User {
  id: string
  email: string
  role: Role
  fullName: string | null
  phone: string | null
  farmId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Farm {
  id: string
  name: string
  slug: string
  description: string | null
  inviteCode: string
  isActive: boolean
  createdAt: string
  _count?: { users: number; fields: number }
}
export interface FarmWithMembers extends Farm {
  users: User[]
}

export interface Location {
  id: string
  county: string
  subCounty: string | null
  ward: string | null
  latitude: number | null
  longitude: number | null
}

export interface FieldWithStatus {
  id: string
  name: string
  cropType: string
  plantingDate: string
  currentStage: CropStage
  status: FieldStatus
  coverImageUrl: string | null
  areaSize: number | null
  lastUpdatedAt: string | null
  isArchived: boolean
  createdAt: string
  agent: { id: string; fullName: string | null; email: string } | null
  location: {
    id: string
    county: string
    subCounty: string | null
    ward: string | null
  }
}

export interface FieldDetail extends FieldWithStatus {
  description: string | null
  updatedAt: string
  updatedBy: { id: string; fullName: string | null } | null
  _count: { updates: number; images: number }
  location: Location
}

export interface FieldUpdate {
  id: string
  fieldId: string
  stage: CropStage
  notes: string | null
  imageUrl: string | null
  observedAt: string
  createdAt: string
  agent: { id: string; fullName: string | null; email: string }
}

export interface FieldImage {
  id: string
  fieldId: string
  url: string
  caption: string | null
  createdAt: string
  uploadedBy: { id: string; fullName: string | null } | null
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface AdminDashboard {
  summary: {
    totalFields: number
    activeAgents: number
    byStatus: Record<FieldStatus, number>
    byStage: Record<CropStage, number>
  }
  atRiskFields: FieldWithStatus[]
  recentUpdates: (FieldUpdate & {
    field: { id: string; name: string; cropType: string }
  })[]
  generatedAt: string
}

export interface AgentDashboard {
  summary: {
    totalAssigned: number
    byStatus: Record<string, number>
  }
  attentionRequired: FieldWithStatus[]
  assignedFields: (FieldWithStatus & { status: FieldStatus })[]
  recentActivity: (Pick<
    FieldUpdate,
    'id' | 'stage' | 'notes' | 'observedAt'
  > & {
    field: { id: string; name: string }
  })[]
  generatedAt: string
}

export interface LivestockDashboard {
  summary: {
    totalAnimals: number
    bySpecies: Record<string, number>
    byStatus: Record<AnimalStatus, number>
  }

  statusDistribution: Record<AnimalStatus, number>

  mortalityTrend: Array<{
    date: string
    count: number
  }>

  healthAlerts: {
    recentIllnesses: Array<{
      id: string
      status: MedicalRecordStatus
      createdAt: Date
      type: MedicalRecordType
      diagnosis: string | null
      animal: {
        id: string
        name: string | null
        species: Species
      }
    }>
    missedTreatments: Array<{
      id: string
      type: MedicalRecordType
      title: string
      scheduledFor: Date | null
      animal: {
        id: string
        name: string | null
        species: Species
      }
    }>
    upcomingVaccinations: Array<MedicalRecord>
    alertCount: number
  }
  generatedAt: string
}

export type NotificationType =
  | 'FIELD_AT_RISK'
  | 'FIELD_UPDATE'
  | 'FIELD_ASSIGNED'
  | 'SYSTEM'

export interface NotificationMetadata {
  fieldId?: string
  fieldName?: string
  cropType?: string
  agentId: string | null
  [key: string]: unknown
}

export interface AppNotification {
  id: string
  type: NotificationType | string
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  fieldId?: string
  metadata: NotificationMetadata | null
  createdAt: string
}

export interface NotificationsResponse {
  data: AppNotification[]
  meta: PaginationMeta
}

export interface UnreadCountResponse {
  unreadCount: number
}

export type AnimalStatus = 'ACTIVE' | 'SOLD' | 'DEAD' | 'MISSING' | 'ARCHIVED'
export type AnimalSex = 'MALE' | 'FEMALE' | 'UNKNOWN'
export type Species =
  | 'CATTLE'
  | 'SHEEP'
  | 'GOATS'
  | 'PIGS'
  | 'POULTRY'
  | 'FISH'
  | 'BEEHIVE'
  | 'OTHER'
export type AnimalIdentityType =
  | 'QR_CODE'
  | 'RFID_TAG'
  | 'EAR_TAG'
  | 'TATTOO'
  | 'MICROCHIP'
  | 'NAME'
  | 'MANUAL_ID'

export interface Animal {
  id: string
  farmId: string
  name?: string
  species: Species
  breed?: string
  sex: AnimalSex
  dateOfBirth?: string
  acquiredDate?: string
  status: AnimalStatus
  statusChangedAt?: string
  statusReason?: string
  color?: string
  weight?: number
  height?: number
  notes?: string
  locationId?: string
  location?: { id: string; county: string; subCounty: string; ward: string }
  maleParentId?: string
  femaleParentId?: string
  identities: AnimalIdentity[]
  medicalRecords?: MedicalRecord[]
  _count?: {
    medicalRecords: number
    breedingEvents: number
    mortalities: number
  }
  createdAt: string
  updatedAt: string
}

export interface AnimalIdentity {
  id: string
  type: AnimalIdentityType
  value: string
  isActive: boolean
  issuedAt: string
  revokedAt?: string
  notes?: string
}

export type MedicalRecordType =
  | 'ILLNESS'
  | 'TREATMENT'
  | 'MEDICATION'
  | 'VACCINATION'
  | 'HEALTH_CHECK'
  | 'SURGERY'
  | 'DEATH'
  | 'INJURY'
  | 'QUARANTINE'
export type MedicalRecordStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED'

export interface MedicalRecord {
  id: string
  type: MedicalRecordType
  status: MedicalRecordStatus
  title: string
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
  recordedBy: { id: string; fullName: string; email: string }
  animal: { id: string; name: string }
  createdAt: string
}

export type BreedingStatus =
  | 'PLANNED'
  | 'MATED'
  | 'PREGNANT'
  | 'DELIVERED'
  | 'FAILED'
  | 'MISCARRIAGE'

export interface BreedingEvent {
  id: string
  status: BreedingStatus
  plannedDate?: string
  matedDate?: string
  expectedBirthDate?: string
  actualBirthDate?: string
  numberOfOffspring?: number
  offspringNotes?: string
  notes?: string
  male: { id: string; name: string; species: string }
  female: { id: string; name: string; species: string }
  recordedBy: { id: string; fullName: string }
  createdAt: string
  updatedAt: string
}

export type MortalityCause =
  | 'DISEASE'
  | 'INJURY'
  | 'AGE'
  | 'PREDATION'
  | 'ACCIDENT'
  | 'UNKNOWN'
  | 'EUTHANASIA'
  | 'OTHER'

export interface Mortality {
  id: string
  dateOfDeath: string
  cause: MortalityCause
  causeDetails?: string
  location?: string
  age?: string
  postMortemNotes?: string
  bodyDisposal?: string
  recordedBy: { id: string; fullName: string }
  createdAt: string
  animal: { id: string; name: string; species: string }
}

export interface AnimalProfile {
  animal: Animal
  medical: MedicalRecord[]
  parents: { sire?: Animal; dam?: Animal }
  offspring: { fromSire: Animal[]; fromDam: Animal[] }
  mortality?: Mortality
}

export interface HerdStats {
  [species: string]: {
    [status: string]: number
  }
}

export interface HealthAlerts {
  recentIllnesses: Array<{
    animal: Partial<Animal>
    diagnosis?: string
    createdAt: string
  }>
  missedTreatments: Array<{ animal: Partial<Animal>; title: string }>
  upcomingVaccinations: Array<{
    animal: Partial<Animal>
    title: string
    scheduledFor: string
  }>
  alertCount: number
}

export type FeedType =
  | 'GRAIN'
  | 'HAY'
  | 'SILAGE'
  | 'PELLETS'
  | 'SUPPLEMENTS'
  | 'PASTURE'
  | 'OTHER'

export type FeedUnit =
  | 'KG'
  | 'TONNES'
  | 'LITRES'
  | 'BAGS'
  | 'BALES'
  | 'BUNDLES'
  | 'OTHER'

export interface Feed {
  id: string
  farmId: string
  name: string
  type: FeedType
  unit: FeedUnit
  costPerUnit?: number
  supplier?: string
  lowStockThreshold?: number
  criticalThreshold?: number
  isActive: boolean
  createdAt: string
}

export type FeedInventoryStatus =
  | 'ADEQUATE'
  | 'LOW'
  | 'CRITICAL'
  | 'OUT_OF_STOCK'
  | 'OVERSTOCKED'

export interface FeedInventory {
  id: string
  feedId: string
  feed: Feed
  currentLevel: number
  unit: string
  location?: string
  lastUpdatedAt?: string
  lastUpdatedReason?: string
  status: FeedInventoryStatus
  updatedAt: string
}

export interface FeedConsumption {
  id: string
  feedId: string
  feed: { id: string; name: string; type: string }
  quantity: number
  unit: string
  observedAt: string // When actually consumed
  createdAt: string // When submitted
  notes?: string
  temperature?: number
  recordedBy: { id: string; fullName: string; email: string }
}

export interface FeedAllocation {
  id: string
  consumptionId: string
  feedId: string
  feed: { id: string; name: string; type: string; unit: string }
  animalId: string
  animal: { id: string; name: string; species: string }
  quantityAllocated: number
  notes?: string
  createdAt: string
}

export interface InventoryStatus {
  byStatus: {
    ADEQUATE: number
    LOW: number
    CRITICAL: number
    OUT_OF_STOCK: number
  }
  totalValue: number
  totalFeeds: number
  alertCount: number
}

export interface ConsumptionTrends {
  period: { days: number; from: string; to: string }
  totalQuantity: number
  avgDaily: number
  maxDaily: number
  minDaily: number
  entries: number
}

export interface StockoutPrediction {
  predictedDate: string
  daysRemaining: number
  currentLevel: number
  avgDailyConsumption: number
  confidence: 'HIGH' | 'LOW'
}
