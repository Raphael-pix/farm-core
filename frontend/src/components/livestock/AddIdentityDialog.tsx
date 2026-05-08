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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddIdentity } from '@/hooks/useAnimals'
import type { AnimalIdentityType } from '@/types/api.types'

const animalIdentityTypes = [
  'QR_CODE',
  'RFID_TAG',
  'EAR_TAG',
  'TATTOO',
  'MICROCHIP',
  'NAME',
  'MANUAL_ID',
] as const

const schema = z.object({
  type: z.enum(animalIdentityTypes),
  value: z.string().min(1, 'Value is required'),
})

type FormValues = z.infer<typeof schema>

export function AddIdentityDialog({
  open,
  onOpenChange,
  animalId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  animalId: string
}) {
  const addMutation = useAddIdentity()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'EAR_TAG', value: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await addMutation.mutateAsync({
        animalId,
        type: values.type,
        value: values.value,
      })
      toast.success('Identity added')
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add identity')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Identity</DialogTitle>
          <DialogDescription>
            Register a new identity tag for this animal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select
              value={watch('type')}
              onValueChange={(v) => setValue('type', v as AnimalIdentityType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QR_CODE">QR Code</SelectItem>
                <SelectItem value="RFID_TAG">RFID</SelectItem>
                <SelectItem value="EAR_TAG">Ear Tag</SelectItem>
                <SelectItem value="TATTOO">Tattoo</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Value</Label>
            <Input {...register('value')} placeholder="e.g. KE-2024-0045" />
            {errors.value && (
              <p className="text-xs text-destructive">{errors.value.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Add Identity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
