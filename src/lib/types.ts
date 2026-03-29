export interface ClimbingGym {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  brand_name: string | null
  google_place_id: string | null
  instagram_url: string | null
  website: string | null
  created_at: string
}

export interface SettingSector {
  name: string
  dates: string[]
  color?: string
  start_time?: string
  end_time?: string
}

export interface GymSettingSchedule {
  id: string
  gym_id: string
  year_month: string
  sectors: SettingSector[]
  source_image_url: string | null
  submitted_by: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface GymWithSchedule extends ClimbingGym {
  gym_setting_schedules: GymSettingSchedule[]
}
