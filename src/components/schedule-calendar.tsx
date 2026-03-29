import { useMemo } from 'react'
import type { SettingSector } from '@/lib/types'
import { SECTOR_COLORS } from '@/components/color-picker'
import { cn } from '@/lib/utils'

interface ScheduleCalendarProps {
  yearMonth: string
  sectors: SettingSector[]
  size?: 'sm' | 'lg'
}

/** sector color value → hex */
function colorHex(colorValue: string | undefined): string {
  if (!colorValue) return '#9CA3AF'
  return SECTOR_COLORS.find((c) => c.value === colorValue)?.hex ?? '#9CA3AF'
}

/** Monday-start Korean weekdays */
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export function ScheduleCalendar({ yearMonth, sectors, size = 'sm' }: ScheduleCalendarProps) {
  const { weeks, dateColorMap } = useMemo(() => {
    const [year, month] = yearMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    // Monday=0, Sunday=6
    const startDow = (firstDay.getDay() + 6) % 7

    // day number → list of sector hex colors
    const map = new Map<number, string[]>()
    for (const sector of sectors) {
      for (const dateStr of sector.dates) {
        const d = new Date(dateStr + 'T00:00:00')
        if (d.getMonth() === month - 1 && d.getFullYear() === year) {
          const day = d.getDate()
          const existing = map.get(day) ?? []
          existing.push(colorHex(sector.color))
          map.set(day, existing)
        }
      }
    }

    // Build weeks grid (Monday-start)
    const grid: (number | null)[][] = []
    let week: (number | null)[] = Array(startDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d)
      if (week.length === 7) {
        grid.push(week)
        week = []
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      grid.push(week)
    }

    return { weeks: grid, dateColorMap: map }
  }, [yearMonth, sectors])

  const isLg = size === 'lg'

  return (
    <div className="select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center font-medium pb-1',
              isLg ? 'text-xs' : 'text-[10px]',
              i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-muted-foreground',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-px">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const colors = day ? dateColorMap.get(day) : undefined
            const hasColors = colors && colors.length > 0
            const isSat = di === 5
            const isSun = di === 6
            return (
              <div
                key={`${wi}-${di}`}
                className={cn(
                  'relative flex flex-col items-center rounded-sm',
                  isLg ? 'py-1.5 min-h-[44px]' : 'py-0.5 min-h-[28px]',
                  hasColors && 'bg-muted/50',
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        'leading-tight',
                        isLg ? 'text-sm' : 'text-[11px]',
                        isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-foreground/70',
                      )}
                    >
                      {day}
                    </span>
                    {hasColors && (
                      <div className={cn('flex mt-[2px]', isLg ? 'gap-1' : 'gap-[2px]')}>
                        {colors.slice(0, 3).map((hex, ci) => (
                          <span
                            key={ci}
                            className={cn(
                              'rounded-full shrink-0',
                              isLg ? 'w-2 h-2' : 'w-[6px] h-[6px]',
                            )}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                        {colors.length > 3 && (
                          <span className="text-[8px] text-muted-foreground leading-none">+</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

/** Sector legend (rendered separately from calendar) */
export function SectorLegend({
  sectors,
  size = 'sm',
}: {
  sectors: SettingSector[]
  size?: 'sm' | 'lg'
}) {
  const isLg = size === 'lg'
  return (
    <div className={cn('flex flex-wrap', isLg ? 'gap-x-4 gap-y-1.5' : 'gap-x-2 gap-y-0.5')}>
      {sectors.map((sector, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className={cn('rounded-full shrink-0', isLg ? 'w-3 h-3' : 'w-2 h-2')}
            style={{ backgroundColor: colorHex(sector.color) }}
          />
          <span
            className={cn(
              'text-muted-foreground whitespace-nowrap',
              isLg ? 'text-sm' : 'text-[10px]',
            )}
          >
            {sector.name}
            {isLg && sector.dates.length > 0 && (
              <span className="text-foreground/50 ml-1">({sector.dates.length}일)</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
