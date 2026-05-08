import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRegisterAnimal, useAnimals } from '@/hooks/useAnimals'
import type { Species, AnimalSex } from '@/types/api.types'

export const Route = createFileRoute('/_app/livestock/animals/register')({
  component: RegisterAnimalPage,
})

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  species: z.enum([
    'CATTLE',
    'GOATS',
    'SHEEP',
    'PIGS',
    'POULTRY',
    'FISH',
    'BEEHIVE',
    'OTHER',
  ]),
  breed: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'UNKNOWN']),
  dateOfBirth: z.string().optional(),
  acquiredDate: z.string().optional(),
  color: z.string().optional(),
  weight: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), { message: 'Must be a number' }),
  height: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), { message: 'Must be a number' }),
  maleParentId: z.string().optional(),
  femaleParentId: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function RegisterAnimalPage() {
  const navigate = useNavigate()
  const createMutation = useRegisterAnimal()
  const { data: animalsData } = useAnimals({ limit: 200, status: 'ACTIVE' })

  const males = animalsData?.data.filter((a) => a.sex === 'MALE') ?? []
  const females = animalsData?.data.filter((a) => a.sex === 'FEMALE') ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      species: 'CATTLE',
      sex: 'MALE',
      acquiredDate: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const animal = await createMutation.mutateAsync({
        name: values.name,
        species: values.species,
        breed: values.breed,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth,
        acquiredDate: values.acquiredDate,
        color: values.color,
        weight: Number(values.weight),
        height: Number(values.height),
        maleParentId: values.maleParentId,
        femaleParentId: values.femaleParentId,
        notes: values.notes,
      })
      toast.success('Animal registered')
      navigate({ to: '/livestock/animals/$id', params: { id: animal.id } })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to register animal')
    }
  }

  return (
    <div className="space-y-4">
      <Link
        to={'/livestock/animals' as any}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Animals
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Register Animal
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new animal to your herd.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name" error={errors.name?.message}>
              <Input {...register('name')} placeholder="e.g. Bessie" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Species">
                <Select
                  value={watch('species')}
                  onValueChange={(v) => setValue('species', v as Species)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CATTLE">Cattle</SelectItem>
                    <SelectItem value="GOAT">Goat</SelectItem>
                    <SelectItem value="SHEEP">Sheep</SelectItem>
                    <SelectItem value="PIG">Pig</SelectItem>
                    <SelectItem value="POULTRY">Poultry</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Breed">
                <Input {...register('breed')} placeholder="e.g. Holstein" />
              </Field>
              <Field label="Sex">
                <Select
                  value={watch('sex')}
                  onValueChange={(v) => setValue('sex', v as AnimalSex)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <Input type="date" {...register('dateOfBirth')} />
              </Field>
              <Field label="Acquired Date">
                <Input type="date" {...register('acquiredDate')} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Physical Attributes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Physical Attributes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Color">
                <Input
                  {...register('color')}
                  placeholder="e.g. Black & White"
                />
              </Field>
              <Field label="Weight (kg)" error={errors.weight?.message}>
                <Input type="number" step="0.1" {...register('weight')} />
              </Field>
              <Field label="Height (cm)" error={errors.height?.message}>
                <Input type="number" step="0.1" {...register('height')} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Lineage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lineage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sire (Father)">
                <Select
                  value={watch('maleParentId') ?? ''}
                  onValueChange={(v) =>
                    setValue('maleParentId', v === '__none__' ? '' : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unknown" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unknown</SelectItem>
                    {males.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Dam (Mother)">
                <Select
                  value={watch('femaleParentId') ?? ''}
                  onValueChange={(v) =>
                    setValue('femaleParentId', v === '__none__' ? '' : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unknown" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unknown</SelectItem>
                    {females.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Location & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Location & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 
            <Field label="Location">
              <Input {...register('location')} placeholder="e.g. Paddock A" />
            </Field>
             */}
            <Field label="Notes">
              <Textarea
                rows={3}
                {...register('notes')}
                placeholder="Any additional notes..."
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to={'/livestock/animals' as any}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Register Animal
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
