import { apiClient } from '@/lib/apiClient'
import type {
  AdminDashboard,
  AgentDashboard,
  LivestockDashboard,
} from '@/types/api.types'

export const dashboardService = {
  async admin() {
    const { data } = await apiClient.get<AdminDashboard>('/dashboard/admin')
    return data
  },
  async agent() {
    const { data } = await apiClient.get<AgentDashboard>('/dashboard/agent')
    return data
  },
  async livestock() {
    const { data } = await apiClient.get<LivestockDashboard>(
      '/livestock/dashboard',
    )
    return data
  },
}
