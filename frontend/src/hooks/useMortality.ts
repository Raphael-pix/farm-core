import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { livestockSerivce } from '@/services/livestock.service'

export function useRecordMortality() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      animalId,
      data,
    }: {
      animalId: string
      data: Parameters<typeof livestockSerivce.recordMortality>[1]
    }) => livestockSerivce.recordMortality(animalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] })
      queryClient.invalidateQueries({ queryKey: ['mortality'] })
      queryClient.invalidateQueries({ queryKey: ['herd-stats'] })
    },
  })
}

export function useMortalityHistory(filters?: {
  days?: number
  page?: number
}) {
  return useQuery({
    queryKey: ['mortality', filters],
    queryFn: () => livestockSerivce.getMortalityHistory(filters),
    staleTime: 5 * 60_000,
  })
}

export function useMortalityAnalytics(days?: number) {
  return useQuery({
    queryKey: ['mortality-analytics', days],
    queryFn: () => livestockSerivce.getMortalityAnalytics(days),
    staleTime: 30 * 60_000,
  })
}
