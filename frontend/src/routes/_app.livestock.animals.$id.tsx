import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  PawPrint,
  Plus,
  QrCode,
  Scale,
  Skull,
  Syringe,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimalStatusBadge } from '@/components/ui/AnimalStatusBadge'
import { MedicalStatusBadge } from '@/components/ui/MedicalStatusBadge'
import { formatDate } from '@/lib/format'
import { RecordMedicalDialog } from '@/components/livestock/RecordMedicalDialog'
import { AddIdentityDialog } from '@/components/livestock/AddIdentityDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAnimalProfile, useChangeAnimalStatus } from '@/hooks/useAnimals'
import { useBreedingEvents } from '@/hooks/useBreeding'
import { BreedingStatusBadge } from '@/components/ui/BreedingStatusBadge'

export const Route = createFileRoute('/_app/livestock/animals/$id')({
  component: AnimalDetailPage,
})

function AnimalDetailPage() {
  const { id } = useParams({ strict: false })
  const { data: animal, isLoading, isError } = useAnimalProfile(id ?? '')
  const changeStatus = useChangeAnimalStatus()
  const { data: breedingData } = useBreedingEvents({
    status: 'PLANNED',
    limit: 50,
  })
  const [medicalOpen, setMedicalOpen] = useState(false)
  const [identityOpen, setIdentityOpen] = useState(false)

  if (!id || isError) {
    return (
      <div className="space-y-3">
        <BackLink />
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Couldn't load animal.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !animal) {
    return (
      <div className="space-y-3">
        <BackLink />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const animalBreedings =
    breedingData?.data.filter(
      (b) => b.male.id === animal.animal.id || b.female.id === animal.animal.id,
    ) ?? []

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      await changeStatus.mutateAsync({ id, status: newStatus, reason })
      toast.success(`Status changed to ${newStatus.toLowerCase()}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Status change failed')
    }
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {animal.animal.name}
                </h1>
                <AnimalStatusBadge status={animal.animal.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {animal.animal.species.charAt(0) +
                  animal.animal.species.slice(1).toLowerCase()}
                {animal.animal.breed ? ` · ${animal.animal.breed}` : ''}
                {' · '}
                {animal.animal.sex === 'MALE' ? '♂ Male' : '♀ Female'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={animal.animal.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="MISSING">Missing</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Stat
              icon={Calendar}
              label="Born"
              value={
                animal.animal.dateOfBirth
                  ? formatDate(animal.animal.dateOfBirth)
                  : '—'
              }
            />
            <Stat
              icon={MapPin}
              label="Location"
              value={animal.animal.location?.county ?? '—'}
            />
            <Stat
              icon={Scale}
              label="Weight"
              value={animal.animal.weight ? `${animal.animal.weight} kg` : '—'}
            />
            <Stat
              icon={PawPrint}
              label="Color"
              value={animal.animal.color ?? '—'}
            />
          </div>

          {animal.parents.sire || animal.parents.dam ? (
            <div className="flex flex-wrap gap-3 text-sm">
              {animal.parents.sire && (
                <span className="rounded-md border border-border px-2 py-1">
                  <span className="text-muted-foreground">Sire: </span>
                  <Link
                    to="/livestock/animals/$id"
                    params={{ id: animal.parents.sire.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {animal.parents.sire.name}
                  </Link>
                </span>
              )}
              {animal.parents.dam && (
                <span className="rounded-md border border-border px-2 py-1">
                  <span className="text-muted-foreground">Dam: </span>
                  <Link
                    to="/livestock/animals/$id"
                    params={{ id: animal.parents.dam.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {animal.parents.dam.name}
                  </Link>
                </span>
              )}
            </div>
          ) : null}

          {animal.animal.notes && (
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              {animal.animal.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="breeding">Breeding</TabsTrigger>
          <TabsTrigger value="identities">Identities</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Animal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Species</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.species.charAt(0) +
                      animal.animal.species.slice(1).toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Breed</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.breed ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Sex</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.sex === 'MALE' ? 'Male' : 'Female'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Weight</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.weight ? `${animal.animal.weight} kg` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Height</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.height ? `${animal.animal.height} cm` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Color</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.color ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Date of Birth
                  </dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.dateOfBirth
                      ? formatDate(animal.animal.dateOfBirth)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Acquired Date
                  </dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.acquiredDate
                      ? formatDate(animal.animal.acquiredDate)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd className="font-medium text-foreground">
                    {animal.animal.location?.county ?? '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setMedicalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Record
            </Button>
          </div>
          <Card>
            <CardContent className="space-y-3 p-3 md:p-4">
              {animal.medical.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No medical records yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {animal.medical.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Syringe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {r.title}
                          </span>
                          <MedicalStatusBadge status={r.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.type.charAt(0) +
                            r.type.slice(1).toLowerCase().replace('_', ' ')}
                          {r.completedAt
                            ? ` · ${formatDate(r.completedAt)}`
                            : r.scheduledFor
                              ? ` · Scheduled ${formatDate(r.scheduledFor)}`
                              : ''}
                        </p>
                        {r.diagnosis && (
                          <p className="text-xs text-muted-foreground">
                            Diagnosis: {r.diagnosis}
                          </p>
                        )}
                        {r.treatment && (
                          <p className="text-xs text-muted-foreground">
                            Treatment: {r.treatment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breeding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Breeding History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {animalBreedings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No breeding events.
                </p>
              ) : (
                animalBreedings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {b.male.name} × {b.female.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.plannedDate
                          ? `Planned ${formatDate(b.plannedDate)}`
                          : ''}
                        {b.expectedBirthDate
                          ? ` · Due ${formatDate(b.expectedBirthDate)}`
                          : ''}
                      </p>
                    </div>
                    <BreedingStatusBadge status={b.status} />
                  </div>
                ))
              )}

              {(animal.parents.sire || animal.parents.dam) && (
                <div className="mt-4 rounded-md border border-border p-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Family Tree
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-xs text-muted-foreground">
                        Sire:
                      </span>
                      {animal.parents.sire ? (
                        <Link
                          to="/livestock/animals/$id"
                          params={{ id: animal.parents.sire.id }}
                          className="font-medium hover:underline"
                        >
                          {animal.parents.sire.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-xs text-muted-foreground">
                        Dam:
                      </span>
                      {animal.parents.dam ? (
                        <Link
                          to="/livestock/animals/$id"
                          params={{ id: animal.parents.dam.id }}
                          className="font-medium hover:underline"
                        >
                          {animal.parents.dam.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </div>
                    <div className="border-t border-border pt-2">
                      <span className="text-xs text-muted-foreground">
                        This animal:{' '}
                      </span>
                      <span className="font-medium">{animal.animal.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Identities Tab */}
        <TabsContent value="identities" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setIdentityOpen(true)}>
              <Plus className="h-4 w-4" /> Add Identity
            </Button>
          </div>
          <Card>
            <CardContent className="space-y-3 p-3 md:p-4">
              {animal.animal.identities.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No identities registered.
                </p>
              ) : (
                animal.animal.identities.map((ident) => (
                  <div
                    key={ident.id}
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                        {ident.type === 'QR_CODE' ? (
                          <QrCode className="h-4 w-4" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {ident.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ident.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ident.isActive ? (
                        <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Revoked
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mortality Tab */}
        <TabsContent value="mortality" className="mt-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              {animal.animal.status === 'DEAD' ? (
                <div className="flex items-center gap-3 rounded-md border border-border p-4">
                  <Skull className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      This animal is recorded as deceased.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      View the mortality records section for details.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  This animal is still alive.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecordMedicalDialog
        open={medicalOpen}
        onOpenChange={setMedicalOpen}
        defaultAnimalId={id}
      />
      <AddIdentityDialog
        open={identityOpen}
        onOpenChange={setIdentityOpen}
        animalId={id}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to={'/livestock/animals' as any}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Animals
    </Link>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border p-2.5">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
