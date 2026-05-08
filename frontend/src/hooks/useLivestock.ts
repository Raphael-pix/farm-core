import { useQuery } from '@tanstack/react-query'
import { livestockSerivce } from '@/services/livestock.service'

export function useHerdStats() {
  return useQuery({
    queryKey: ['herd-stats'],
    queryFn: () => livestockSerivce.getHerdStats(),
    staleTime: 5 * 60_000,
  })
}

export function useHealthAlertsSummary() {
  return useQuery({
    queryKey: ['health-alerts-summary'],
    queryFn: () => livestockSerivce.getHealthAlertsSummary(),
    refetchInterval: 10 * 60_000,
  })
}

export function useSpecies() {
  return useQuery({
    queryKey: ['species-metadata'],
    queryFn: () => livestockSerivce.getSpecies(),
    staleTime: Infinity, // Never stale
  })
}

export function useIdentityTypes() {
  return useQuery({
    queryKey: ['identity-types-metadata'],
    queryFn: () => livestockSerivce.getIdentityTypes(),
    staleTime: Infinity,
  })
}

export function useMedicalEventTypes() {
  return useQuery({
    queryKey: ['medical-types-metadata'],
    queryFn: () => livestockSerivce.getMedicalEventTypes(),
    staleTime: Infinity,
  })
}

export function useDeathCauses() {
  return useQuery({
    queryKey: ['death-causes-metadata'],
    queryFn: () => livestockSerivce.getDeathCauses(),
    staleTime: Infinity,
  })
}
