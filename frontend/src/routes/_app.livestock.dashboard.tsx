import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Bug,
  Calendar,
  Heart,
  PawPrint,
  Plus,
  Skull,
  Syringe,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
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
  LineChart,
  Line,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { MedicalStatusBadge } from '@/components/ui/MedicalStatusBadge'
import { useLivestockDashboard } from '@/hooks/useDashboard'
import { formatDate } from '@/lib/format'
import type { AnimalStatus } from '@/types/api.types'

export const Route = createFileRoute('/_app/livestock/dashboard')({
  component: LivestockDashboardPage,
})

const STATUS_COLORS: Record<AnimalStatus, string> = {
  ACTIVE: 'var(--success)',
  SOLD: '#3b82f6',
  DEAD: 'var(--neutral-soft-foreground)',
  MISSING: 'var(--warning)',
  ARCHIVED: '#9ca3af',
}

const STATUS_LABELS: Record<AnimalStatus, string> = {
  ACTIVE: 'Active',
  SOLD: 'Sold',
  DEAD: 'Dead',
  MISSING: 'Missing',
  ARCHIVED: 'Archived',
}

function LivestockDashboardPage() {
  const { data: dashboard, isLoading } = useLivestockDashboard()

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Livestock Dashboard
        </h1>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { summary, statusDistribution, mortalityTrend, healthAlerts } =
    dashboard

  console.log(summary)

  const pieData = (Object.keys(statusDistribution) as AnimalStatus[])
    .map((k) => ({
      name: STATUS_LABELS[k],
      key: k,
      value: statusDistribution[k],
    }))
    .filter((d) => d.value > 0)

  const speciesData = Object.entries(summary.bySpecies).map(([k, v]) => ({
    name: k.charAt(0) + k.slice(1).toLowerCase(),
    value: v,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Livestock Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your herd, health, and recent activity.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard
          label="Total Animals"
          value={summary.totalAnimals}
          icon={PawPrint}
        />
        <SummaryCard
          label="Active"
          value={summary.byStatus.ACTIVE}
          icon={Heart}
          tone="success"
        />
        <SummaryCard
          label="Dead"
          value={summary.byStatus.DEAD}
          icon={Skull}
          tone="muted"
        />
        <SummaryCard
          label="Sold"
          value={summary.byStatus.SOLD}
          icon={TrendingDown}
        />
        <SummaryCard
          label="Missing"
          value={summary.byStatus.MISSING}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={'/livestock/animals/register' as any}>
            <Plus className="h-4 w-4" /> Register Animal
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={'/livestock/medical' as any}>
            <Syringe className="h-4 w-4" /> Record Medical
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={'/livestock/breeding' as any}>
            <Heart className="h-4 w-4" /> Breeding Event
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={'/livestock/mortality' as any}>
            <Skull className="h-4 w-4" /> Record Mortality
          </Link>
        </Button>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Herd by Species
            </CardTitle>
          </CardHeader>
          <CardContent>
            {speciesData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No animals
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speciesData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      stroke="var(--card)"
                    >
                      {speciesData.map((_, i) => (
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
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pieData}>
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
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {pieData.map((d) => (
                        <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mortality Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Mortality Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mortalityTrend.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mortalityTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: 'var(--border)',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--destructive)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Illnesses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bug className="h-4 w-4 text-destructive" /> Recent Illnesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthAlerts.recentIllnesses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent illnesses
              </p>
            ) : (
              healthAlerts.recentIllnesses.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {r.animal.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.diagnosis}
                    </p>
                  </div>
                  <MedicalStatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Syringe className="h-4 w-4 text-blue-600" /> Upcoming
              Vaccinations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthAlerts.upcomingVaccinations.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                None scheduled
              </p>
            ) : (
              healthAlerts.upcomingVaccinations.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {r.animal.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    {r.scheduledFor ? formatDate(r.scheduledFor) : '—'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Missed Treatments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-warning" /> Missed
              Treatments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthAlerts.missedTreatments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                All treatments on track
              </p>
            ) : (
              healthAlerts.missedTreatments.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {r.animal.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.title}</p>
                  </div>
                  <MedicalStatusBadge status={'MISSED'} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
