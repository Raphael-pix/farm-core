import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Skull } from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/PagerControls'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMortalityHistory } from '@/hooks/useMortality'
import { formatDate } from '@/lib/format'
import { RecordMortalityDialog } from '@/components/livestock/RecordMortalityDialog'

export const Route = createFileRoute('/_app/livestock/mortality')({
  component: MortalityPage,
})

function MortalityPage() {
  const [page, setPage] = useState(1)
  const [cause, setCause] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const params = {
    page,
    limit: 20,
    cause: cause === 'all' ? undefined : cause,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { data, isLoading, isError } = useMortalityHistory(params)

  // Compute analytics from available data
  const records = data?.data ?? []
  const causeCounts: Record<string, number> = {}
  const speciesCounts: Record<string, number> = {}
  for (const r of records) {
    const c =
      r.cause.charAt(0) + r.cause.slice(1).toLowerCase().replace('_', ' ')
    causeCounts[c] = (causeCounts[c] ?? 0) + 1
    const sp =
      r.animal.species.charAt(0) + r.animal.species.slice(1).toLowerCase()
    speciesCounts[sp] = (speciesCounts[sp] ?? 0) + 1
  }

  const causeChartData = Object.entries(causeCounts).map(([name, value]) => ({
    name,
    value,
  }))
  const speciesChartData = Object.entries(speciesCounts).map(
    ([name, value]) => ({ name, value }),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Mortality Records
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and analyze animal mortality.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Record Mortality
        </Button>
      </div>

      {/* Analytics Charts */}
      {records.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Deaths by Cause
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={causeChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={2}
                      stroke="var(--card)"
                    >
                      {causeChartData.map((_, i) => (
                        <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: 'var(--border)',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Deaths by Species
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speciesChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: 'var(--border)',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--destructive)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 p-3 md:p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="md:col-span-4">
              <Select
                value={cause}
                onValueChange={(v) => {
                  setCause(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cause" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All causes</SelectItem>
                  <SelectItem value="DISEASE">Disease</SelectItem>
                  <SelectItem value="PREDATOR">Predator</SelectItem>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="OLD_AGE">Old Age</SelectItem>
                  <SelectItem value="SLAUGHTER">Slaughter</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
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
              Couldn't load mortality records.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-175 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Animal</th>
                  <th className="px-4 py-2 font-medium">Cause</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 4 }).map((_i, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (data?.data.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Skull className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                      No mortality records found.
                    </td>
                  </tr>
                ) : (
                  data!.data.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {r.animal.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.cause.charAt(0) +
                          r.cause.slice(1).toLowerCase().replace('_', ' ')}
                        {r.causeDetails ? ` — ${r.causeDetails}` : ''}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(r.dateOfDeath)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.recordedBy.fullName}
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

      <RecordMortalityDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
