import { apiClient } from '@/lib/apiClient'
import type { PaginatedResponse, Feed } from '@/types/api.types'

interface CreateFeedInput {
  name: string
  type: string
  description?: string
  unit: string
  costPerUnit?: number
  supplier?: string
  lowStockThreshold?: number
  criticalThreshold?: number
}
interface ListFeedsParams {
  type?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export const feedService = {
  async createFeed(input: CreateFeedInput) {
    const { data } = await apiClient.post<Feed>('feed/feeds', input)
    return data
  },

  async listFeeds(params?: ListFeedsParams) {
    const { data } = await apiClient.get<PaginatedResponse<Feed>>(
      '/feed/feeds',
      { params },
    )
    return data
  },
}
