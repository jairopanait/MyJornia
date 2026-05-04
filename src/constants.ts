import type { CalendarViewMode, ShiftIconId, WorkRules } from './types'

export const tabTitles = {
  summary: 'Resumen',
  settings: 'Ajustes',
  calendar: 'Calendario',
  shiftTypes: 'Turnos',
  profile: 'Perfil',
}

export const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export const calendarViews: { id: CalendarViewMode; label: string }[] = [
  { id: 'month', label: 'Mes' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Día' },
  { id: 'year', label: 'Año' },
]

export const colorOptions = ['#2563EB', '#0EA5E9', '#22C55E', '#F97316', '#EF4444', '#8B5CF6', '#111827']

export const defaultShiftIcon: ShiftIconId = 'briefcase'

export const defaultWorkRules: WorkRules = {
  user_id: '',
  night_start: '22:00',
  night_end: '06:00',
  monthly_extra_hours: 160,
  contract_hours: 160,
  base_salary: 0,
  complementary_hour_rate: 0,
  night_hour_rate: 0,
  holiday_hour_rate: 0,
  holiday_shift_rate: 0,
  holiday_pay_mode: 'hour',
  autonomous_community: '',
}
