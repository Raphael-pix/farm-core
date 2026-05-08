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
import { useCreateBreedingEvent } from '@/hooks/useBreeding'

const schema = z.object({
  maleId: z.string().min(1, 'Male is required'),
  femaleId: z.string().min(1, 'Female is required'),
  plannedDate: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function CreateBreedingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const createMutation = useCreateBreedingEvent()
  const { data: animalsData } = useAnimals({ limit: 200, status: 'ACTIVE' })

  const males = animalsData?.data.filter((a) => a.sex === 'MALE') ?? []
  const females = animalsData?.data.filter((a) => a.sex === 'FEMALE') ?? []

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
      plannedDate: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        maleId: values.maleId,
        femaleId: values.femaleId,
        plannedDate: values.plannedDate,
        notes: values.notes,
      })
      toast.success('Breeding event created')
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to create breeding event',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Breeding Event</DialogTitle>
          <DialogDescription>Plan a new breeding pair.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sire (Male)</Label>
            <Select
              value={watch('maleId')}
              onValueChange={(v) => setValue('femaleId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Male" />
              </SelectTrigger>
              <SelectContent>
                {males.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} (
                    {a.species.charAt(0) + a.species.slice(1).toLowerCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.maleId && (
              <p className="text-xs text-destructive">
                {errors.maleId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Dam (Female)</Label>
            <Select
              value={watch('femaleId')}
              onValueChange={(v) => setValue('femaleId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dam" />
              </SelectTrigger>
              <SelectContent>
                {females.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} (
                    {a.species.charAt(0) + a.species.slice(1).toLowerCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.femaleId && (
              <p className="text-xs text-destructive">
                {errors.femaleId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Planned Date</Label>
            <Input type="date" {...register('plannedDate')} />
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
