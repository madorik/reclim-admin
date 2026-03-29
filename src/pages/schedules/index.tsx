import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { useGymsWithSchedules, useDeleteSchedule, useBrands } from '@/hooks/useSchedules'
import { getCurrentYearMonth, getYearMonthOptions, formatYearMonth } from '@/lib/utils'
import { ScheduleCalendar } from '@/components/schedule-calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Search, Pencil, CalendarPlus, Trash2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { SECTOR_COLORS } from '@/components/color-picker'
import type { GymWithSchedule, GymSettingSchedule } from '@/lib/types'

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
  const deleteSchedule = useDeleteSchedule()

  const handleDelete = (scheduleId: string, gymName: string) => {
    if (!confirm(`"${gymName}"의 ${formatYearMonth(yearMonth)} 세팅일정을 삭제하시겠습니까?`)) return
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

  // Separate registered / unregistered gyms
  const { registered, unregistered } = useMemo(() => {
    if (!gyms) return { registered: [], unregistered: [] }
    const reg: { gym: GymWithSchedule; schedule: GymSettingSchedule }[] = []
    const unreg: GymWithSchedule[] = []
    for (const gym of gyms) {
      const s = gym.gym_setting_schedules?.[0]
      if (s) {
        reg.push({ gym, schedule: s })
      } else {
        unreg.push(gym)
      }
    }
    return { registered: reg, unregistered: unreg }
  }, [gyms])

  const totalCount = gyms?.length ?? 0

  return (
    <PageContainer
      title="세팅일정 관리"
      description={`${formatYearMonth(yearMonth)} 클라이밍장별 세팅일정 현황`}
      actions={
        <Button onClick={() => navigate(`/schedules/new?ym=${yearMonth}`)}>
          <Plus className="h-4 w-4 mr-1" />
          새 일정 추가
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={yearMonth} onValueChange={(v) => { if (v) updateParam('ym', v) }}>
          <SelectTrigger className="w-[150px]">
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

        <div className="flex items-center gap-1">
          <Select
            value={regionFilter || undefined}
            onValueChange={(v) => { if (v) updateParam('region', v) }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="전체 지역" />
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
              className="text-xs text-muted-foreground hover:text-foreground px-1"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Select
            value={brandFilter || undefined}
            onValueChange={(v) => { if (v) updateParam('brand', v) }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="전체 브랜드" />
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
              className="text-xs text-muted-foreground hover:text-foreground px-1"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 flex-1 max-w-xs">
          <Input
            placeholder="암장 이름 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && gyms && (
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>전체 {totalCount}</span>
            <span className="text-foreground font-medium">등록 {registered.length}</span>
            <span>미등록 {unregistered.length}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Registered gyms: card grid with calendar ── */}
          {registered.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                등록됨
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {registered.length}개
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {registered.map(({ gym, schedule }) => (
                  <div
                    key={gym.id}
                    className="rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition-colors"
                  >
                    {/* Header */}
                    <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold truncate">{gym.name}</h4>
                          {gym.instagram_url && (
                            <a
                              href={gym.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-500 hover:text-pink-600 transition-colors shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {gym.brand_name && (
                          <span className="text-[11px] text-muted-foreground">{gym.brand_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {schedule.source_image_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(schedule.source_image_url)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="원본 이미지 보기"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="수정"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(schedule.id, gym.name)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Calendar + optional image side by side */}
                    <div className="px-4 pb-3">
                      <div className={`flex gap-3 ${schedule.source_image_url ? '' : ''}`}>
                        {/* Source image thumbnail */}
                        {schedule.source_image_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(schedule.source_image_url)}
                            className="shrink-0 w-[90px] rounded-lg overflow-hidden border border-border/50 hover:border-foreground/20 transition-colors"
                          >
                            <img
                              src={schedule.source_image_url}
                              alt="세팅일정 원본"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        )}
                        {/* Calendar */}
                        <div className="flex-1 min-w-0">
                          <ScheduleCalendar
                            yearMonth={yearMonth}
                            sectors={schedule.sectors}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Unregistered gyms: compact table ── */}
          {unregistered.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                미등록
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {unregistered.length}개
                </span>
              </h3>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border">
                  {unregistered.map((gym) => (
                    <div
                      key={gym.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{gym.name}</span>
                          {gym.brand_name && (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {gym.brand_name}
                            </span>
                          )}
                          {gym.instagram_url && (
                            <a
                              href={gym.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-500 hover:text-pink-600 transition-colors shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {gym.address && (
                          <p className="text-xs text-muted-foreground truncate">{gym.address}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 ml-3 h-7 text-xs"
                        onClick={() =>
                          navigate(`/schedules/new?gym_id=${gym.id}&ym=${yearMonth}`)
                        }
                      >
                        <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                        세팅하기
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalCount === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null) }}>
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
