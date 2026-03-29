import { useState } from 'react'
import type { SettingSector } from '@/lib/types'

interface ParseResult {
  gym_name?: string
  gym_brand?: string
  year_month?: string
  sectors?: SettingSector[]
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
  const token = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

  /** Edge Function 프록시를 통해 R2에 업로드 후 다운로드 URL 반환 */
  const upload = async (file: File): Promise<string> => {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const objectKey = `setting-schedules/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('objectKey', objectKey)

      const res = await fetch(`${supabaseUrl}/functions/v1/r2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: token,
        },
        body: formData,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`업로드 실패 (${res.status}): ${errText}`)
      }

      const { url: downloadUrl } = await res.json()
      return downloadUrl
    } finally {
      setUploading(false)
    }
  }

  /** GPT Vision으로 세팅일정 이미지 분석 */
  const analyzeImage = async (file: File): Promise<ParseResult> => {
    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`${supabaseUrl}/functions/v1/parse-setting-schedule`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: token,
        },
        body: formData,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`AI 분석 실패 (${res.status}): ${errText}`)
      }

      return await res.json() as ParseResult
    } finally {
      setAnalyzing(false)
    }
  }

  return { upload, uploading, analyzeImage, analyzing }
}
