import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import ScheduleListPage from '@/pages/schedules/index'
import ScheduleFormPage from '@/pages/schedules/form'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/schedules" replace />} />
          <Route path="/schedules" element={<ScheduleListPage />} />
          <Route path="/schedules/new" element={<ScheduleFormPage />} />
          <Route path="/schedules/:id/edit" element={<ScheduleFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
