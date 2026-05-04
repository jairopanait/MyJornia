import type { Session } from '@supabase/supabase-js'

export type ThemeMode = 'light' | 'dark'
export type AppTab = 'summary' | 'settings' | 'calendar' | 'shiftTypes' | 'profile'
export type CalendarViewMode = 'month' | 'week' | 'day' | 'year'
export type ShiftActionMode = 'create' | 'add' | null
export type ShiftIconId = 'briefcase' | 'sun' | 'moon' | 'coffee' | 'umbrella' | 'star' | 'home' | 'heart' | 'plane'

export type WorkShift = {
  id: string
  user_id: string
  shift_type_id: string | null
  title: string | null
  color: string | null
  icon: ShiftIconId | null
  is_time_off: boolean | null
  work_date: string
  start_at: string
  end_at: string
  break_minutes: number
  notes: string | null
}

export type ShiftType = {
  id: string
  user_id: string
  name: string
  color: string
  icon: ShiftIconId | null
  is_time_off: boolean | null
  default_start_time: string | null
  default_end_time: string | null
}

export type WorkRules = {
  user_id: string
  night_start: string
  night_end: string
  monthly_extra_hours: number
  contract_hours: number
  base_salary: number
  complementary_hour_rate: number
  night_hour_rate: number
  holiday_hour_rate: number
  holiday_shift_rate: number
  holiday_pay_mode: 'hour' | 'shift'
  autonomous_community: string | null
}

export type PayrollDeduction = {
  id: string
  user_id: string
  name: string
  percentage: number
}

export type PayrollAdditionMode = 'fixed' | 'per_shift' | 'per_hour'

export type PayrollAddition = {
  id: string
  user_id: string
  name: string
  amount: number
  mode: PayrollAdditionMode
  shift_type_ids: string[]
}

export type NightPayRange = {
  id: string
  user_id: string
  start_time: string
  end_time: string
  hour_rate: number
}

export type LocalHoliday = {
  id: string
  user_id: string
  holiday_date: string
}

export type AdminStats = {
  profiles: number
  shifts: number
  shiftTypes: number
}

export type SaveShiftPayload = {
  title: string
  color: string
  icon: ShiftIconId
  isTimeOff: boolean
  start: string
  end: string
  breakValue: string
  notes: string
  shiftTypeId?: string | null
}

export type SessionState = Session | null
