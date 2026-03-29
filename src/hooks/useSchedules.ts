import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GymWithSchedule, GymSettingSchedule } from '@/lib/types'
import type { ScheduleFormValues } from '@/lib/schemas'

interface ScheduleFilters {
  yearMonth: string
  search?: string
  region?: string
  brand?: string
}

export function useGymsWithSchedules(filters: ScheduleFilters) {
  return useQuery({
    queryKey: ['gyms-with-schedules', filters],
    queryFn: async () => {
      let query = supabase
        .from('climbing_gyms')
        .select(`*, gym_setting_schedules!left(*)`)
        .eq('gym_setting_schedules.year_month', filters.yearMonth)
        .not('instagram_url', 'is', null)
        .order('name')

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.region) {
        query = query.ilike('address', `%${filters.region}%`)
      }
      if (filters.brand) {
        query = query.ilike('brand_name', `%${filters.brand}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as GymWithSchedule[]
    },
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('climbing_gyms')
        .select('brand_name')
        .not('brand_name', 'is', null)
        .not('instagram_url', 'is', null)
      if (error) throw error
      const unique = [...new Set(data.map((d) => (d.brand_name as string).trim()).filter(Boolean))].sort()
      return unique
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: ['schedule', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('gym_setting_schedules')
        .select('*, climbing_gyms(name, instagram_url)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as GymSettingSchedule & {
        climbing_gyms: { name: string; instagram_url: string | null }
      }
    },
    enabled: !!id,
  })
}

export function useUpsertSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      const { data, error } = await supabase
        .from('gym_setting_schedules')
        .upsert(
          {
            gym_id: values.gym_id,
            year_month: values.year_month,
            sectors: values.sectors,
            source_image_url: values.source_image_url ?? null,
            status: 'approved',
          },
          { onConflict: 'gym_id,year_month' },
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms-with-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gym_setting_schedules')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms-with-schedules'] })
    },
  })
}
