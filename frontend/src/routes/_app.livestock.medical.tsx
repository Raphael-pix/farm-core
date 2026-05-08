import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Syringe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { MedicalStatusBadge } from '@/components/ui/MedicalStatusBadge'
import { useFullMedicalHistory } from '@/hooks/useMedical'
import { formatDate } from '@/lib/format'
import { RecordMedicalDialog } from '@/components/livestock/RecordMedicalDialog'

export const Route = createFileRoute('/_app/livestock/medical')({
  component: MedicalRecordsPage,
})

function MedicalRecordsPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const params = {
    page,
    limit: 20,
    type: type === 'all' ? undefined : type,
    status: status === 'all' ? undefined : status,
  }

  const { data, isLoading, isError } = useFullMedicalHistory(params)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Medical Records
          </h1>
          <p className="text-sm text-muted-foreground">
            Track vaccinations, treatments, and health events.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Record
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 md:p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="md:col-span-3">
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="VACCINATION">Vaccination</SelectItem>
                  <SelectItem value="TREATMENT">Treatment</SelectItem>
                  <SelectItem value="MEDICATION">Medication</SelectItem>
                  <SelectItem value="ILLNESS">Illness</SelectItem>
                  <SelectItem value="HEALTH_CHECK">Checkup</SelectItem>
                  <SelectItem value="SURGERY">Surgery</SelectItem>
                  <SelectItem value="DEATH">Death</SelectItem>
                  <SelectItem value="INJURY">Injury</SelectItem>
                  <SelectItem value="QUARANTINE">Quarantine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                placeholder="From"
              />
            </div>
            <div className="md:col-span-3">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                placeholder="To"
              />
            </div>
          </div>

          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Couldn't load medical records.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-175 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Animal</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Date</th>
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
                      <Syringe className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                      No medical records found.
                    </td>
                  </tr>
                ) : (
                  data!.data.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/livestock/animals/$id"
                          params={{ id: r.animal.id }}
                          className="font-medium text-foreground hover:underline"
                        >
                          {r.animal.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.type.charAt(0) +
                          r.type.slice(1).toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.title}</td>
                      <td className="px-4 py-3">
                        <MedicalStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          r.completedAt ?? r.scheduledFor ?? r.createdAt,
                        )}
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

      <RecordMedicalDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
