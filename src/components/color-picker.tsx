import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export const SECTOR_COLORS = [
  { value: 'red', label: '빨강', hex: '#EF4444' },
  { value: 'orange', label: '주황', hex: '#F97316' },
  { value: 'yellow', label: '노랑', hex: '#EAB308' },
  { value: 'green', label: '초록', hex: '#22C55E' },
  { value: 'blue', label: '파랑', hex: '#3B82F6' },
  { value: 'purple', label: '보라', hex: '#A855F7' },
  { value: 'pink', label: '분홍', hex: '#EC4899' },
  { value: 'white', label: '흰색', hex: '#F9FAFB' },
  { value: 'black', label: '검정', hex: '#1F2937' },
  { value: 'gray', label: '회색', hex: '#9CA3AF' },
  { value: 'mint', label: '민트', hex: '#5EEAD4' },
  { value: 'navy', label: '남색', hex: '#1E3A5F' },
]

interface ColorPickerProps {
  value?: string
  onChange: (color: string | undefined) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const current = SECTOR_COLORS.find((c) => c.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              'w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform shrink-0',
              value ? 'border-foreground/20' : 'border-dashed border-muted-foreground/40',
            )}
            style={{ backgroundColor: current?.hex ?? 'transparent' }}
            title={current?.label ?? '색상 선택'}
          />
        }
      />
      <PopoverContent className="w-auto p-2" align="start" sideOffset={8}>
        <div className="grid grid-cols-6 gap-1.5">
          {SECTOR_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                onChange(color.value)
                setOpen(false)
              }}
              className={cn(
                'w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform',
                value === color.value ? 'border-foreground ring-2 ring-ring' : 'border-foreground/10',
              )}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            />
          ))}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
              setOpen(false)
            }}
            className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive py-1 rounded transition-colors"
          >
            <X className="h-3 w-3" />
            색상 제거
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
