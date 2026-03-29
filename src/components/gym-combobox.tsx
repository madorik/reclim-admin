import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useGyms } from '@/hooks/useGyms'
import type { ClimbingGym } from '@/lib/types'

interface GymComboboxProps {
  value: string
  onSelect: (gym: ClimbingGym) => void
  disabled?: boolean
}

export function GymCombobox({ value, onSelect, disabled }: GymComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: gyms = [] } = useGyms(search || undefined)

  const selectedGym = gyms.find((g) => g.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="w-full"
        disabled={disabled}
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedGym?.name ?? '암장을 선택해주세요'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="암장 이름 검색..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            <CommandGroup>
              {gyms.map((gym) => (
                <CommandItem
                  key={gym.id}
                  value={gym.id}
                  onSelect={() => {
                    onSelect(gym)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === gym.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium">{gym.name}</div>
                    {gym.address && (
                      <div className="text-xs text-muted-foreground truncate max-w-[340px]">
                        {gym.address}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
