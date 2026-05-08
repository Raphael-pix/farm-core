import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { livestockSerivce } from '@/services/livestock.service'

export function useCreateBreedingEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: livestockSerivce.createBreedingEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-events'] })
    },
  })
}

export function useRecordMating() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => livestockSerivce.recordMating(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-events'] })
    },
  })
}

export function useRecordBirth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      numberOfOffspring,
      details,
    }: {
      eventId: string
      numberOfOffspring: number
      details?: string
    }) => livestockSerivce.recordBirth(eventId, numberOfOffspring, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-events'] })
      queryClient.invalidateQueries({ queryKey: ['animals'] })
    },
  })
}

export function useParentage(animalId: string) {
  return useQuery({
    queryKey: ['parentage', animalId],
    queryFn: () => livestockSerivce.getParentage(animalId),
    enabled: !!animalId,
  })
}

export function useOffspring(animalId: string) {
  return useQuery({
    queryKey: ['offspring', animalId],
    queryFn: () => livestockSerivce.getOffspring(animalId),
    enabled: !!animalId,
  })
}

export function useFamilyTree(animalId: string) {
  return useQuery({
    queryKey: ['family-tree', animalId],
    queryFn: () => livestockSerivce.getFamilyTree(animalId),
    enabled: !!animalId,
  })
}
