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
import { useAnimals } from '@/hooks/useAnimals'
import { useRecordMortality } from '@/hooks/useMortality'
import type { MortalityCause } from '@/types/api.types'

const mortalityCause = [
  'DISEASE',
  'INJURY',
  'AGE',
  'PREDATION',
  'ACCIDENT',
  'UNKNOWN',
  'EUTHANASIA',
  'OTHER',
]

const schema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  dateOfDeath: z.string().min(1, 'Date is required'),
  cause: z.enum(mortalityCause),
  causeDetails: z.string().optional(),
  location: z.string().optional(),
  age: z.string().optional(),
  notes: z.string().optional(),
  bodyDisposal: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function RecordMortalityDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const createMutation = useRecordMortality()
  const { data: animalsData } = useAnimals({ limit: 200, status: 'ACTIVE' })
  const activeAnimals = animalsData?.data ?? []

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
      cause: 'UNKNOWN',
      dateOfDeath: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        animalId: values.animalId,
        data: {
          dateOfDeath: values.dateOfDeath,
          cause: values.cause,
          causeDetails: values.causeDetails,
          location: values.location,
          age: values.age,
          postMortemNotes: values.notes,
          bodyDisposal: values.bodyDisposal,
        },
      })
      toast.success('Mortality recorded')
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to record mortality')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Mortality</DialogTitle>
          <DialogDescription>
            Record an animal death. Only active animals are selectable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Animal</Label>
            <Select
              value={watch('animalId')}
              onValueChange={(v) => setValue('animalId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select animal" />
              </SelectTrigger>
              <SelectContent>
                {activeAnimals.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} (
                    {a.species.charAt(0) + a.species.slice(1).toLowerCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.animalId && (
              <p className="text-xs text-destructive">
                {errors.animalId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cause</Label>
              <Select
                value={watch('cause')}
                onValueChange={(v) => setValue('cause', v as MortalityCause)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISEASE">Disease</SelectItem>
                  <SelectItem value="PREDATOR">Predator</SelectItem>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="OLD_AGE">Old Age</SelectItem>
                  <SelectItem value="SLAUGHTER">Slaughter</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" {...register('dateOfDeath')} />
              {errors.dateOfDeath && (
                <p className="text-xs text-destructive">
                  {errors.dateOfDeath.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cause Details</Label>
            <Input
              {...register('causeDetails')}
              placeholder="Additional details"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Age</Label>
            <Input {...register('age')} placeholder="Age" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input {...register('location')} placeholder="Where found" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Disposal Method</Label>
              <Select
                value={watch('bodyDisposal') ?? ''}
                onValueChange={(v) =>
                  setValue('bodyDisposal', v === '__none__' ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not specified</SelectItem>
                  <SelectItem value="BURIED">Buried</SelectItem>
                  <SelectItem value="BURNED">Burned</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="COMPOSTED">Composted</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={2} {...register('notes')} />
          </div>

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
              Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
