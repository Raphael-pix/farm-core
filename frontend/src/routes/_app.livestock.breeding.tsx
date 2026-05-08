import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/PagerControls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BreedingStatusBadge } from '@/components/ui/BreedingStatusBadge'
import { useBreedingEvents } from '@/hooks/useBreeding'
import { formatDate } from '@/lib/format'
import { CreateBreedingDialog } from '@/components/livestock/CreateBreedingDialog'
import type { BreedingStatus } from '@/types/api.types'

export const Route = createFileRoute('/_app/livestock/breeding')({
  component: BreedingEventsPage,
})

function BreedingEventsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const params = {
    page,
    limit: 20,
    status: status === 'all' ? undefined : (status as BreedingStatus),
  }

  const { data, isLoading, isError } = useBreedingEvents(params)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Breeding Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan and track breeding across your herd.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Breeding
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 md:p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="md:col-span-4">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as BreedingStatus)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="MATED">Mated</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="BORN">Born</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="md:col-span-4">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Couldn't load breeding events.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-175 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Sire</th>
                  <th className="px-4 py-2 font-medium">Dam</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Planned Date</th>
                  <th className="px-4 py-2 font-medium">Expected Birth</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 5 }).map((_i, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (data?.data.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                      No breeding events found.
                    </td>
                  </tr>
                ) : (
                  data!.data.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/livestock/animals/$id"
                          params={{ id: b.male.id }}
                          className="font-medium text-foreground hover:underline"
                        >
                          {b.male.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/livestock/animals/$id"
                          params={{ id: b.female.id }}
                          className="font-medium text-foreground hover:underline"
                        >
                          {b.female.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <BreedingStatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.plannedDate ? formatDate(b.plannedDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.expectedBirthDate
                          ? formatDate(b.expectedBirthDate)
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data?.meta && (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <CreateBreedingDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
