import { monthNames, weekdayLabels } from '../constants'
import type { CalendarViewMode, WorkShift } from '../types'

export function padNumber(value: number) {
  return value.toString().padStart(2, '0')
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

export function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(dateKey: string, days: number) {
  const date = dateFromKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function getMonthRange(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  }
}

export function getVisibleShiftRange(viewMode: CalendarViewMode, monthDate: Date, dateKey: string) {
  if (viewMode === 'day') {
    return { start: dateKey, end: dateKey }
  }

  if (viewMode === 'week') {
    const selected = dateFromKey(dateKey)
    const mondayOffset = (selected.getDay() + 6) % 7
    const weekStart = new Date(selected)
    weekStart.setDate(selected.getDate() - mondayOffset)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return { start: toDateKey(weekStart), end: toDateKey(weekEnd) }
  }

  if (viewMode === 'year') {
    return {
      start: `${monthDate.getFullYear()}-01-01`,
      end: `${monthDate.getFullYear()}-12-31`,
    }
  }

  return getMonthRange(monthDate)
}

export function buildCalendarDays(monthDate: Date, shifts: WorkShift[]) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - mondayOffset)
  const todayKey = toDateKey(new Date())

  return Array.from({ length: 42 }, (_item, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const dateKey = toDateKey(date)

    return {
      dateKey,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === monthDate.getMonth(),
      isToday: dateKey === todayKey,
      shifts: shifts.filter((shift) => shift.work_date === dateKey),
    }
  })
}

export function buildWeekDays(dateKey: string, shifts: WorkShift[]) {
  const selected = dateFromKey(dateKey)
  const mondayOffset = (selected.getDay() + 6) % 7
  const weekStart = new Date(selected)
  weekStart.setDate(selected.getDate() - mondayOffset)
  const todayKey = toDateKey(new Date())

  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const nextDateKey = toDateKey(date)

    return {
      dateKey: nextDateKey,
      dayNumber: date.getDate(),
      weekday: weekdayLabels[index],
      isToday: nextDateKey === todayKey,
      shifts: shifts.filter((shift) => shift.work_date === nextDateKey),
    }
  })
}

export function parseShiftDateTime(dateKey: string, timeText: string) {
  const match = timeText.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/)

  if (!match) {
    return null
  }

  const date = dateFromKey(dateKey)
  date.setHours(Number(match[1]), Number(match[2]), 0, 0)

  return date
}

export function normalizeTime(time: string | null) {
  return time ? time.slice(0, 5) : ''
}

export function formatTime(isoDate: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromKey(dateKey))
}

export function getMonthTitle(monthDate: Date) {
  return `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`
}
