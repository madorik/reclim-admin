import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { X, CalendarDays } from 'lucide-react'
import { formatDateKo } from '@/lib/utils'
import { ko } from 'date-fns/locale'

interface MultiDatePickerProps {
  yearMonth: string
  selected: string[]
  onSelect: (dates: string[]) => void
}

export function MultiDatePicker({ yearMonth, selected, onSelect }: MultiDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [year, month] = yearMonth.split('-').map(Number)
  const baseDate = new Date(year, month - 1, 1)

  const selectedDates = selected.map((d) => new Date(d + 'T00:00:00'))

  const handleSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      onSelect([])
      return
    }
    const formatted = dates.map((d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    })
    onSelect(formatted)
  }

  const removeDate = (dateStr: string) => {
    onSelect(selected.filter((d) => d !== dateStr))
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              날짜 선택
            </Button>
          }
        />
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={handleSelect}
            defaultMonth={baseDate}
            locale={ko}
          />
        </PopoverContent>
      </Popover>
      {selected.sort().map((d) => (
        <Badge key={d} variant="secondary" className="gap-1 h-6 text-xs font-normal">
          {formatDateKo(d)}
          <button type="button" onClick={() => removeDate(d)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {selected.length === 0 && (
        <span className="text-xs text-muted-foreground">날짜를 선택해주세요</span>
      )}
    </div>
  )
}
