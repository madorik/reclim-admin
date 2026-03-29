import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addMonths, subMonths } from "date-fns"
import { ko } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentYearMonth(): string {
  return format(new Date(), "yyyy-MM")
}

export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-")
  return `${year}년 ${parseInt(month)}월`
}

export function getYearMonthOptions(range = 6): { value: string; label: string }[] {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = -range; i <= range; i++) {
    const d = i < 0 ? subMonths(now, -i) : addMonths(now, i)
    const value = format(d, "yyyy-MM")
    options.push({ value, label: formatYearMonth(value) })
  }
  return options
}

export function getDaysInMonth(yearMonth: string): Date[] {
  const [year, month] = yearMonth.split("-").map(Number)
  const days: Date[] = []
  const date = new Date(year, month - 1, 1)
  while (date.getMonth() === month - 1) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export function formatDateKo(dateStr: string): string {
  return format(new Date(dateStr), "M/d (EEE)", { locale: ko })
}
