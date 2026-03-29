import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { GymCombobox } from '@/components/gym-combobox'
import { MultiDatePicker } from '@/components/multi-date-picker'
import { useSchedule, useUpsertSchedule, useDeleteSchedule } from '@/hooks/useSchedules'
import { useGym } from '@/hooks/useGyms'
import { useImageUpload } from '@/hooks/useImageUpload'
import { scheduleFormSchema, type ScheduleFormValues } from '@/lib/schemas'
import { getCurrentYearMonth, getYearMonthOptions } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ExternalLink, ImageIcon, ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import { ColorPicker } from '@/components/color-picker'
import type { ClimbingGym } from '@/lib/types'

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {children}
    </div>
  )
}

export default function ScheduleFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const paramGymId = searchParams.get('gym_id') ?? ''
  const paramYm = searchParams.get('ym') ?? getCurrentYearMonth()

  const { data: existingSchedule, isLoading: scheduleLoading } = useSchedule(id)
  const { data: paramGym } = useGym(paramGymId || undefined)

  const [selectedGym, setSelectedGym] = useState<ClimbingGym | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, analyzeImage, analyzing } = useImageUpload()
  const upsertSchedule = useUpsertSchedule()
  const deleteSchedule = useDeleteSchedule()
  const monthOptions = useMemo(() => getYearMonthOptions(), [])

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      gym_id: '',
      year_month: paramYm,
      sectors: [{ name: '', dates: [] }],
      source_image_url: null,
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'sectors',
  })

  useEffect(() => {
    if (isEdit && existingSchedule) {
      form.reset({
        gym_id: existingSchedule.gym_id,
        year_month: existingSchedule.year_month,
        sectors: existingSchedule.sectors,
        source_image_url: existingSchedule.source_image_url,
      })
      if (existingSchedule.source_image_url) {
        setImagePreview(existingSchedule.source_image_url)
      }
      if (existingSchedule.climbing_gyms) {
        setSelectedGym({
          id: existingSchedule.gym_id,
          name: existingSchedule.climbing_gyms.name,
          instagram_url: existingSchedule.climbing_gyms.instagram_url,
        } as ClimbingGym)
      }
    }
  }, [isEdit, existingSchedule, form])

  useEffect(() => {
    if (!isEdit && paramGym) {
      form.setValue('gym_id', paramGym.id)
      setSelectedGym(paramGym)
    }
  }, [paramGym, isEdit, form])

  const handleGymSelect = (gym: ClimbingGym) => {
    form.setValue('gym_id', gym.id)
    setSelectedGym(gym)
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setImagePreview(localUrl)
    setUploadedFile(file)
    // reset file input so same file can be re-selected
    e.target.value = ''
  }

  /** 이미지 R2 업로드만 */
  const handleUpload = async () => {
    if (!uploadedFile) return
    try {
      const url = await upload(uploadedFile)
      form.setValue('source_image_url', url)
      setImagePreview(url)
      toast.success('이미지가 업로드되었습니다')
    } catch {
      toast.error('이미지 업로드에 실패했습니다')
    }
  }

  /** 이미지 분석 → 섹터 자동 채움 + 업로드 */
  const handleAnalyze = async () => {
    if (!uploadedFile) return

    // 업로드는 항상 시도
    const uploadPromise = upload(uploadedFile).then((url) => {
      form.setValue('source_image_url', url)
      setImagePreview(url)
      return true
    }).catch(() => false)

    // 분석 시도
    try {
      const [result, uploaded] = await Promise.all([
        analyzeImage(uploadedFile),
        uploadPromise,
      ])

      if (result.sectors && result.sectors.length > 0) {
        replace(result.sectors.map((s) => ({
          name: s.name,
          dates: s.dates ?? [],
          color: s.color,
        })))
        toast.success(`${result.sectors.length}개 섹터가 자동 입력되었습니다`)
      } else {
        toast.warning('섹터를 인식하지 못했습니다. 수동으로 입력해주세요.')
      }

      if (result.year_month && !isEdit) {
        form.setValue('year_month', result.year_month)
      }

      if (!uploaded) {
        toast.warning('이미지 업로드는 실패했습니다. 수동으로 다시 시도해주세요.')
      }
    } catch (err) {
      // 분석 실패해도 업로드 결과 반영
      const uploaded = await uploadPromise
      if (uploaded) {
        toast.warning('AI 분석은 실패했지만 이미지는 업로드되었습니다. 수동으로 입력해주세요.')
      } else {
        toast.error(`실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
      }
    }
  }

  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      await upsertSchedule.mutateAsync(values)
      toast.success(isEdit ? '세팅일정이 수정되었습니다' : '세팅일정이 등록되었습니다')
      navigate(`/schedules?ym=${values.year_month}`)
    } catch {
      toast.error('저장에 실패했습니다')
    }
  }

  const yearMonth = form.watch('year_month')
  const isBusy = uploading || analyzing

  if (isEdit && scheduleLoading) {
    return (
      <PageContainer title="세팅일정 수정">
        <div className="grid grid-cols-[340px_1fr] gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={isEdit ? '세팅일정 수정' : '새 세팅일정 등록'}
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/schedules?ym=${yearMonth}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록으로
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* ── Left: 암장 정보 + 이미지 ── */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <Panel className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">암장</Label>
                <GymCombobox
                  value={form.watch('gym_id')}
                  onSelect={handleGymSelect}
                  disabled={isEdit}
                />
                {form.formState.errors.gym_id && (
                  <p className="text-xs text-destructive">{form.formState.errors.gym_id.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">월</Label>
                <Select
                  value={yearMonth}
                  onValueChange={(v) => { if (v) form.setValue('year_month', v) }}
                  disabled={isEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedGym?.instagram_url && (
                <a
                  href={selectedGym.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-600 transition-colors font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  인스타그램에서 확인
                </a>
              )}
            </Panel>

            {/* 이미지 업로드 + AI 분석 */}
            <Panel className="space-y-3">
              <Label className="text-xs text-muted-foreground">세팅 일정 이미지</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="세팅 일정"
                    className="w-full rounded-lg border object-contain max-h-[360px] bg-muted/30"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                      className="bg-black/60 text-white rounded-md px-2 py-1 text-xs hover:bg-black/80"
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setUploadedFile(null)
                        form.setValue('source_image_url', null)
                      }}
                      className="bg-black/60 text-white rounded-md p-1 hover:bg-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* 분석 오버레이 */}
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                      <span className="text-white text-sm font-medium">AI 분석 중...</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">클릭하여 업로드</span>
                </button>
              )}

              {/* 액션 버튼들 */}
              {uploadedFile && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isBusy}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white"
                  >
                    {analyzing ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                    )}
                    {analyzing ? 'AI 분석 중...' : 'AI 자동 입력'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUpload}
                    disabled={isBusy}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : null}
                    {uploading ? '업로드 중...' : '업로드만'}
                  </Button>
                </div>
              )}
            </Panel>
          </div>

          {/* ── Right: 섹터 편집 ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                섹터 목록
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {fields.length}개
                </span>
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', dates: [] })}
                className="h-7 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                섹터 추가
              </Button>
            </div>

            {form.formState.errors.sectors?.message && (
              <p className="text-xs text-destructive">{form.formState.errors.sectors.message}</p>
            )}

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {fields.map((field, index) => {
                return (
                  <div key={field.id} className="p-3 space-y-2 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        value={form.watch(`sectors.${index}.color`)}
                        onChange={(c) => form.setValue(`sectors.${index}.color`, c)}
                      />
                      <Input
                        {...form.register(`sectors.${index}.name`)}
                        placeholder="섹터 이름 (예: SECTOR A, 1섹터)"
                        className="h-8 text-sm flex-1"
                      />
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="pl-7">
                      <MultiDatePicker
                        yearMonth={yearMonth}
                        selected={form.watch(`sectors.${index}.dates`) ?? []}
                        onSelect={(dates) => form.setValue(`sectors.${index}.dates`, dates)}
                      />
                      {form.formState.errors.sectors?.[index]?.name && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.sectors[index].name?.message}
                        </p>
                      )}
                      {form.formState.errors.sectors?.[index]?.dates && (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.sectors[index].dates?.message}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              {fields.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-3">등록된 섹터가 없습니다</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', dates: [] })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    첫 섹터 추가
                  </Button>
                </div>
              )}
            </div>

            {/* 저장 / 삭제 */}
            <div className="flex items-center justify-between pt-3">
              <div>
                {isEdit && id && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deleteSchedule.isPending}
                    onClick={() => {
                      if (!confirm('이 세팅일정을 삭제하시겠습니까?')) return
                      deleteSchedule.mutate(id, {
                        onSuccess: () => {
                          toast.success('세팅일정이 삭제되었습니다')
                          navigate(`/schedules?ym=${yearMonth}`)
                        },
                        onError: () => toast.error('삭제에 실패했습니다'),
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/schedules?ym=${yearMonth}`)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={upsertSchedule.isPending || isBusy}
                  className="min-w-[100px]"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {upsertSchedule.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
