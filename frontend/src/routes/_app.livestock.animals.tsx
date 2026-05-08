import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Search, PawPrint } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/PagerControls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimalStatusBadge } from '@/components/ui/AnimalStatusBadge'
import { useAnimals } from '@/hooks/useAnimals'
import { timeAgo } from '@/lib/format'
import type { AnimalStatus, Species } from '@/types/api.types'

export const Route = createFileRoute('/_app/livestock/animals')({
  component: AnimalsListPage,
})

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'CATTLE', label: 'Cattle' },
  { value: 'GOATS', label: 'Goat' },
  { value: 'SHEEP', label: 'Sheep' },
  { value: 'PIGS', label: 'Pig' },
  { value: 'POULTRY', label: 'Poultry' },
  { value: 'FISH', label: 'Fish' },
  { value: 'BEEHIVE', label: 'Beehive' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_OPTIONS: { value: AnimalStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'DEAD', label: 'Dead' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'ARCHIVED', label: 'Archived' },
]

function AnimalsListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [sex, setSex] = useState<string>('all')

  const params = {
    page,
    limit: 20,
    search: search.trim() || undefined,
    species: species === 'all' ? undefined : species,
    status: status === 'all' ? undefined : status,
    sex: sex === 'all' ? undefined : sex,
  }

  const { data, isLoading, isError } = useAnimals(params)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Animals
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your animal registry.
          </p>
        </div>
        <Button asChild>
          <Link to={'/livestock/animals/register' as any}>
            <Plus className="h-4 w-4" /> Register Animal
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 md:p-4">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            <div className="relative md:col-span-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name…"
                className="pl-8"
              />
            </div>
            <div className="md:col-span-2">
              <Select
                value={species}
                onValueChange={(v) => {
                  setSpecies(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All species</SelectItem>
                  {SPECIES_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
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
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select
                value={sex}
                onValueChange={(v) => {
                  setSex(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Couldn't load animals.
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-190 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Species</th>
                  <th className="px-4 py-2 font-medium">Breed</th>
                  <th className="px-4 py-2 font-medium">Sex</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_i, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (data?.data.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      <PawPrint className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                      No animals match these filters.
                    </td>
                  </tr>
                ) : (
                  data!.data.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/livestock/animals/$id"
                          params={{ id: a.id }}
                          className="font-medium text-foreground hover:underline"
                        >
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.species.charAt(0) + a.species.slice(1).toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.breed ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.sex === 'MALE' ? '♂ Male' : '♀ Female'}
                      </td>
                      <td className="px-4 py-3">
                        <AnimalStatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.location?.county ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {timeAgo(a.createdAt)}
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
    </div>
  )
}
