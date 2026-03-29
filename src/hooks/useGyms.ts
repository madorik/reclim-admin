import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ClimbingGym } from '@/lib/types'

export function useGyms(search?: string) {
  return useQuery({
    queryKey: ['gyms', search],
    queryFn: async () => {
      let query = supabase
        .from('climbing_gyms')
        .select('*')
        .order('name')

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as ClimbingGym[]
    },
  })
}

export function useGym(id: string | undefined) {
  return useQuery({
    queryKey: ['gym', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('climbing_gyms')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ClimbingGym
    },
    enabled: !!id,
  })
}
