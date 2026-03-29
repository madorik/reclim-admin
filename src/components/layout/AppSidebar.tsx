import { CalendarDays } from 'lucide-react'
import { NavLink } from 'react-router'

export function AppSidebar() {
  return (
    <aside className="w-56 min-h-screen bg-[var(--sidebar)] text-[var(--sidebar-foreground)] flex flex-col shrink-0">
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <h1 className="text-lg font-bold text-white">리클림 백오피스</h1>
      </div>
      <nav className="flex-1 p-2">
        <NavLink
          to="/schedules"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-[var(--sidebar-accent)] text-white'
                : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50'
            }`
          }
        >
          <CalendarDays className="h-4 w-4" />
          세팅일정 관리
        </NavLink>
      </nav>
    </aside>
  )
}
