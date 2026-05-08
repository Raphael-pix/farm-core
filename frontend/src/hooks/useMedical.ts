import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { livestockSerivce } from '@/services/livestock.service'
import type { RecordMedicalInput } from '@/services/livestock.service'

export function useMedicalHistory(animalId: string) {
  return useQuery({
    queryKey: ['medical-history', animalId],
    queryFn: () => livestockSerivce.getMedicalHistory(animalId),
    enabled: !!animalId,
    staleTime: 30_000,
  })
}
export function useFullMedicalHistory(filters?: {
  status?: string
  type?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['medical-history'],
    queryFn: () => livestockSerivce.getFullMedicalHistory(filters),
    staleTime: 30_000,
  })
}

export function useRecordMedical() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      animalId,
      data,
    }: {
      animalId: string
      data: RecordMedicalInput
    }) => livestockSerivce.recordMedical(animalId, data),
    onSuccess: (_record, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['medical-history', variables.animalId],
      })
      queryClient.invalidateQueries({
        queryKey: ['animal', variables.animalId],
      })
      queryClient.invalidateQueries({ queryKey: ['health-alerts'] })
    },
  })
}

export function useScheduleVaccination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      animalId,
      data,
    }: {
      animalId: string
      data: Parameters<typeof livestockSerivce.scheduleVaccination>[1]
    }) => livestockSerivce.scheduleVaccination(animalId, data),
    onSuccess: (_record, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['medical-history', variables.animalId],
      })
      queryClient.invalidateQueries({ queryKey: ['upcoming-vaccinations'] })
    },
  })
}

export function useCompleteMedical() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      recordId,
      completedAt,
    }: {
      recordId: string
      completedAt?: string
    }) => livestockSerivce.completeMedicalRecord(recordId, completedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-history'] })
      queryClient.invalidateQueries({ queryKey: ['health-alerts'] })
    },
  })
}

export function useUpcomingVaccinations() {
  return useQuery({
    queryKey: ['upcoming-vaccinations'],
    queryFn: () => livestockSerivce.getUpcomingVaccinations(),
    staleTime: 5 * 60_000,
  })
}

export function useHealthAlerts() {
  return useQuery({
    queryKey: ['health-alerts'],
    queryFn: () => livestockSerivce.getHealthAlerts(),
    refetchInterval: 10 * 60_000, // Poll every 10 minutes
  })
}
