import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useRecordMedical } from '@/hooks/useMedical'
import type { MedicalRecordType, MedicalRecordStatus } from '@/types/api.types'

const medicalRecordType = [
  'ILLNESS',
  'TREATMENT',
  'MEDICATION',
  'VACCINATION',
  'HEALTH_CHECK',
  'SURGERY',
  'DEATH',
  'INJURY',
  'QUARANTINE',
]
const schema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  type: z.enum(medicalRecordType),
  title: z.string().min(2, 'Title is required'),
  status: z.enum(['COMPLETED', 'SCHEDULED', 'MISSED', 'CANCELLED']),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.number().optional(),
  doseUnit: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  veterinarianName: z.string().optional(),
  clinicName: z.string().optional(),
  cost: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), { message: 'Must be a number' }),
  notes: z.string().optional(),
  scheduledFor: z.string().optional(),
  completedAt: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function RecordMedicalDialog({
  open,
  onOpenChange,
  defaultAnimalId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultAnimalId?: string
}) {
  const createMutation = useRecordMedical()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      animalId: defaultAnimalId ?? '',
      type: 'VACCINATION',
      status: 'COMPLETED',
      completedAt: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        animalId: values.animalId,
        data: {
          type: values.type as MedicalRecordType,
          title: values.title,
          status: values.status,
          diagnosis: values.diagnosis,
          treatment: values.treatment,
          medication: values.medication,
          dosage: values.dosage,
          doseUnit: values.doseUnit,
          frequency: values.frequency,
          duration: values.duration,
          veterinarianName: values.veterinarianName,
          clinicName: values.clinicName,
          notes: values.notes,
          scheduledFor: values.scheduledFor,
          completedAt: values.completedAt,
        },
      })
      toast.success('Medical record created')
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create record')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Medical Event</DialogTitle>
          <DialogDescription>
            Add a medical record for this animal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {!defaultAnimalId && (
            <Field label="Animal ID" error={errors.animalId?.message}>
              <Input {...register('animalId')} placeholder="Animal ID" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as MedicalRecordType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACCINATION">Vaccination</SelectItem>
                  <SelectItem value="TREATMENT">Treatment</SelectItem>
                  <SelectItem value="ILLNESS">Illness</SelectItem>
                  <SelectItem value="CHECKUP">Checkup</SelectItem>
                  <SelectItem value="SURGERY">Surgery</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={watch('status')}
                onValueChange={(v) =>
                  setValue('status', v as MedicalRecordStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Title" error={errors.title?.message}>
            <Input
              {...register('title')}
              placeholder="e.g. Foot & Mouth Vaccine"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Diagnosis">
              <Input {...register('diagnosis')} />
            </Field>
            <Field label="Treatment">
              <Input {...register('treatment')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Medication">
              <Input {...register('medication')} />
            </Field>
            <Field label="Dosage">
              <Input type="number" {...register('dosage')} />
            </Field>
            <Field label="Dose Unit">
              <Input {...register('doseUnit')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Frequency">
              <Input {...register('frequency')} />
            </Field>
            <Field label="Duration">
              <Input {...register('duration')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Veterinarian">
              <Input {...register('veterinarianName')} />
            </Field>
            <Field label="Clinic">
              <Input {...register('clinicName')} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Cost" error={errors.cost?.message}>
              <Input type="number" step="0.01" {...register('cost')} />
            </Field>
            <Field label="Scheduled date">
              <Input type="date" {...register('scheduledFor')} />
            </Field>
            <Field label="Completed date">
              <Input type="date" {...register('completedAt')} />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea rows={2} {...register('notes')} />
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
