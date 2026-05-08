import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { livestockSerivce } from '@/services/livestock.service'

export function useAnimals(filters?: {
  species?: string
  status?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['animals', filters],
    queryFn: () => livestockSerivce.listAnimals(filters),
    staleTime: 60_000,
  })
}

export function useAnimal(id: string) {
  return useQuery({
    queryKey: ['animal', id],
    queryFn: () => livestockSerivce.getAnimal(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useAnimalProfile(id: string) {
  return useQuery({
    queryKey: ['animal-profile', id],
    queryFn: () => livestockSerivce.getAnimalProfile(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useRegisterAnimal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: livestockSerivce.registerAnimal,
    onSuccess: (newAnimal) => {
      queryClient.invalidateQueries({ queryKey: ['animals'] })
      queryClient.setQueryData(['animal', newAnimal.id], newAnimal)
    },
  })
}

export function useUpdateAnimal(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof livestockSerivce.updateAnimal>[1]) =>
      livestockSerivce.updateAnimal(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['animal', id], updated)
      queryClient.invalidateQueries({ queryKey: ['animals'] })
    },
  })
}

export function useChangeAnimalStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string
      status: string
      reason?: string
    }) => livestockSerivce.changeStatus(id, status, reason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['animals'] })
      queryClient.setQueryData(['animal', updated.id], updated)
    },
  })
}

export function useLookupAnimal() {
  return useMutation({
    mutationFn: ({ type, value }: { type: string; value: string }) =>
      livestockSerivce.lookupAnimal(type, value),
  })
}

export function useAddIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      animalId,
      type,
      value,
    }: {
      animalId: string
      type: string
      value: string
    }) => livestockSerivce.addIdentity(animalId, type, value),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['animal', variables.animalId],
      })
    },
  })
}

export function useRevokeIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      animalId,
      identityId,
    }: {
      animalId: string
      identityId: string
    }) => livestockSerivce.revokeIdentity(animalId, identityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['animal', variables.animalId],
      })
    },
  })
}
