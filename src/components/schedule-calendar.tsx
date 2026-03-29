import { useMemo } from 'react'
import type { SettingSector } from '@/lib/types'
import { SECTOR_COLORS } from '@/components/color-picker'

interface ScheduleCalendarProps {
  yearMonth: string
  sectors: SettingSector[]
}

/** sector color value → hex */
function colorHex(colorValue: string | undefined): string {
  if (!colorValue) return '#9CA3AF' // default gray
  return SECTOR_COLORS.find((c) => c.value === colorValue)?.hex ?? '#9CA3AF'
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function ScheduleCalendar({ yearMonth, sectors }: ScheduleCalendarProps) {
  const { weeks, dateColorMap } = useMemo(() => {
    const [year, month] = yearMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDow = firstDay.getDay() // 0=Sun

    // Build map: day number → list of sector colors
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

    // Build weeks grid
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

  return (
    <div className="select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-medium pb-0.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'}`}
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
            const isSun = di === 0
            const isSat = di === 6
            return (
              <div
                key={`${wi}-${di}`}
                className={`relative flex flex-col items-center py-0.5 min-h-[28px] rounded-sm ${
                  colors && colors.length > 0 ? 'bg-muted/50' : ''
                }`}
              >
                {day && (
                  <>
                    <span
                      className={`text-[11px] leading-tight ${
                        isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-foreground/70'
                      }`}
                    >
                      {day}
                    </span>
                    {colors && colors.length > 0 && (
                      <div className="flex gap-[2px] mt-[1px]">
                        {colors.slice(0, 3).map((hex, ci) => (
                          <span
                            key={ci}
                            className="w-[6px] h-[6px] rounded-full shrink-0"
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

      {/* Sector legend */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5 pt-1.5 border-t border-border/50">
        {sectors.map((sector, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: colorHex(sector.color) }}
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {sector.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
