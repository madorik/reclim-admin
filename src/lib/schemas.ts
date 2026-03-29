import { z } from 'zod'

export const settingSectorSchema = z.object({
  name: z.string().min(1, '섹터 이름을 입력해주세요'),
  dates: z.array(z.string()).min(1, '날짜를 선택해주세요'),
  color: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
})

export const scheduleFormSchema = z.object({
  gym_id: z.string().min(1, '암장을 선택해주세요'),
  year_month: z.string().regex(/^\d{4}-\d{2}$/, '올바른 형식이 아닙니다'),
  sectors: z.array(settingSectorSchema).min(1, '최소 1개의 섹터를 추가해주세요'),
  source_image_url: z.string().nullable().optional(),
})

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>
