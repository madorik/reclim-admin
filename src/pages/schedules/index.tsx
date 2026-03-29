import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  useGymsWithSchedules,
  useGymSchedule,
  useDeleteSchedule,
  useBrands,
} from '@/hooks/useSchedules'
import { getCurrentYearMonth, getYearMonthOptions, formatYearMonth, formatDateKo } from '@/lib/utils'
import { ScheduleCalendar, SectorLegend } from '@/components/schedule-calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Pencil,
  CalendarPlus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { SECTOR_COLORS } from '@/components/color-picker'
import { cn } from '@/lib/utils'
import type { GymWithSchedule } from '@/lib/types'

const REGIONS = [
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '인천', label: '인천' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '대전', label: '대전' },
  { value: '광주', label: '광주' },
  { value: '울산', label: '울산' },
  { value: '강원', label: '강원' },
]

function colorHex(value: string | undefined): string {
  if (!value) return '#9CA3AF'
  return SECTOR_COLORS.find((c) => c.value === value)?.hex ?? '#9CA3AF'
}

export default function ScheduleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const yearMonth = searchParams.get('ym') ?? getCurrentYearMonth()
  const selectedGymId = searchParams.get('gym') ?? ''
  const searchQuery = searchParams.get('q') ?? ''
  const regionFilter = searchParams.get('region') ?? ''
  const brandFilter = searchParams.get('brand') ?? ''
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const monthOptions = useMemo(() => getYearMonthOptions(), [])
  const { data: brands = [] } = useBrands()
  const { data: gyms, isLoading } = useGymsWithSchedules({
    yearMonth,
    search: searchQuery || undefined,
    region: regionFilter || undefined,
    brand: brandFilter || undefined,
  })
  const { data: activeSchedule, isLoading: scheduleLoading } = useGymSchedule(
    selectedGymId || undefined,
    yearMonth,
  )
  const deleteSchedule = useDeleteSchedule()

  const handleDelete = (scheduleId: string, gymName: string) => {
    if (!confirm(`"${gymName}"의 ${formatYearMonth(yearMonth)} 세팅일정을 삭제하시겠습니까?`))
      return
    deleteSchedule.mutate(scheduleId, {
      onSuccess: () => toast.success('세팅일정이 삭제되었습니다'),
      onError: () => toast.error('삭제에 실패했습니다'),
    })
  }

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      return prev
    })
  }

  const handleSearch = () => updateParam('q', searchInput)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const selectGym = (gymId: string) => updateParam('gym', gymId)

  // Counts
  const { registered, unregistered, selectedGym } = useMemo(() => {
    if (!gyms) return { registered: 0, unregistered: 0, selectedGym: undefined }
    let reg = 0
    let unreg = 0
    let sel: GymWithSchedule | undefined
    for (const gym of gyms) {
      if (gym.gym_setting_schedules?.[0]) reg++
      else unreg++
      if (gym.id === selectedGymId) sel = gym
    }
    return { registered: reg, unregistered: unreg, selectedGym: sel }
  }, [gyms, selectedGymId])

  return (
    <PageContainer
      title="세팅일정 관리"
      description={`${formatYearMonth(yearMonth)} 세팅일정 현황`}
      actions={
        <Button
          size="sm"
          onClick={() =>
            navigate(
              `/schedules/new?ym=${yearMonth}${selectedGymId ? `&gym_id=${selectedGymId}` : ''}`,
            )
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          새 일정 추가
        </Button>
      }
    >
      <div className="flex gap-5 min-h-[calc(100vh-10rem)]">
        {/* ── Left Panel: Gym List ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          {/* Month selector */}
          <Select value={yearMonth} onValueChange={(v) => { if (v) updateParam('ym', v) }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filters */}
          <div className="flex gap-1.5">
            <div className="flex items-center gap-0.5 flex-1">
              <Select
                value={regionFilter || undefined}
                onValueChange={(v) => { if (v) updateParam('region', v) }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="지역" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {regionFilter && (
                <button
                  type="button"
                  onClick={() => updateParam('region', '')}
                  className="text-[10px] text-muted-foreground hover:text-foreground shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-1">
              <Select
                value={brandFilter || undefined}
                onValueChange={(v) => { if (v) updateParam('brand', v) }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="브랜드" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brandFilter && (
                <button
                  type="button"
                  onClick={() => updateParam('brand', '')}
                  className="text-[10px] text-muted-foreground hover:text-foreground shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-1">
            <Input
              placeholder="암장 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-xs"
            />
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Gym list */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card -mx-0.5 px-0.5">
            {isLoading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : gyms && gyms.length > 0 ? (
              <div className="py-1">
                {gyms.map((gym) => {
                  const schedule = gym.gym_setting_schedules?.[0]
                  const isActive = gym.id === selectedGymId
                  return (
                    <button
                      key={gym.id}
                      type="button"
                      onClick={() => selectGym(gym.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50 text-foreground',
                      )}
                    >
                      {/* Registration indicator */}
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          schedule ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{gym.name}</div>
                        {gym.brand_name && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {gym.brand_name}
                          </div>
                        )}
                      </div>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/50" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
          </div>

          {/* Stats */}
          {!isLoading && gyms && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>전체 {gyms.length}</span>
              <span>
                <span className="text-emerald-500 font-medium">{registered}</span> 등록
                {' / '}
                <span>{unregistered}</span> 미등록
              </span>
            </div>
          )}
        </div>

        {/* ── Right Panel: Schedule Detail ── */}
        <div className="flex-1 min-w-0">
          {!selectedGymId ? (
            /* No gym selected */
            <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  좌측에서 클라이밍장을 선택해주세요
                </p>
              </div>
            </div>
          ) : scheduleLoading ? (
            /* Loading */
            <div className="space-y-4">
              <Skeleton className="h-10 w-60" />
              <Skeleton className="h-[400px] rounded-xl" />
            </div>
          ) : activeSchedule ? (
            /* Schedule exists */
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{selectedGym?.name}</h2>
                    {selectedGym?.instagram_url && (
                      <a
                        href={selectedGym.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {selectedGym?.brand_name && (
                    <p className="text-sm text-muted-foreground">{selectedGym.brand_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/schedules/${activeSchedule.id}/edit`)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:border-destructive"
                    onClick={() =>
                      handleDelete(activeSchedule.id, selectedGym?.name ?? '')
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Content: Calendar + Image */}
              <div className="flex gap-6 items-start">
                {/* Calendar */}
                <div className="flex-1 min-w-0 rounded-xl border border-border bg-card p-5 space-y-4">
                  <ScheduleCalendar
                    yearMonth={yearMonth}
                    sectors={activeSchedule.sectors}
                    size="lg"
                  />
                  {/* Legend */}
                  <div className="pt-3 border-t border-border/50">
                    <SectorLegend sectors={activeSchedule.sectors} size="lg" />
                  </div>

                  {/* Sector date details */}
                  <div className="space-y-2 pt-2">
                    {activeSchedule.sectors.map((sector, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: colorHex(sector.color) }}
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{sector.name}</span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {sector.dates.sort().map((d) => (
                              <span
                                key={d}
                                className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
                              >
                                {formatDateKo(d)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source image */}
                {activeSchedule.source_image_url && (
                  <div className="shrink-0 w-64 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ImageIcon className="h-3.5 w-3.5" />
                      원본 이미지
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(activeSchedule.source_image_url)}
                      className="w-full rounded-xl border border-border overflow-hidden hover:border-foreground/20 transition-colors"
                    >
                      <img
                        src={activeSchedule.source_image_url}
                        alt="세팅일정 원본"
                        className="w-full object-contain max-h-[480px] bg-muted/30"
                        loading="lazy"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No schedule for this gym/month */
            <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedGym?.name}</span>의{' '}
                  {formatYearMonth(yearMonth)} 세팅일정이 없습니다
                </p>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/schedules/new?gym_id=${selectedGymId}&ym=${yearMonth}`)
                  }
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  세팅일정 등록
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image preview dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null)
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto p-2">
          <DialogTitle className="sr-only">세팅일정 원본 이미지</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              alt="세팅일정 원본"
              className="w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
