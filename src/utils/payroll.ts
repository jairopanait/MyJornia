import type { NightPayRange, PayrollAddition, PayrollDeduction, ShiftIconId, WorkRules, WorkShift } from '../types'

export function parseNumber(value: string) {
  const normalized = value.replace(',', '.').trim()
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatNumber(value: number) {
  return Number.isFinite(value) ? String(value) : '0'
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function getShiftHours(shift: WorkShift) {
  if (shift.is_time_off) {
    return 0
  }

  const start = new Date(shift.start_at).getTime()
  const end = new Date(shift.end_at).getTime()
  const breakHours = shift.break_minutes / 60

  return Math.max(0, (end - start) / 36e5 - breakHours)
}

function getTimeMinutes(timeText: string) {
  const [hours, minutes] = timeText.slice(0, 5).split(':').map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

function getOverlapHours(start: Date, end: Date, windowStart: Date, windowEnd: Date) {
  const overlapStart = Math.max(start.getTime(), windowStart.getTime())
  const overlapEnd = Math.min(end.getTime(), windowEnd.getTime())

  return Math.max(0, (overlapEnd - overlapStart) / 36e5)
}

export function getNightHours(shift: WorkShift, nightStart: string, nightEnd: string) {
  if (shift.is_time_off) {
    return 0
  }

  const shiftStart = new Date(shift.start_at)
  const shiftEnd = new Date(shift.end_at)
  const startMinutes = getTimeMinutes(nightStart)
  const endMinutes = getTimeMinutes(nightEnd)
  const startsPreviousDay = new Date(shiftStart)
  startsPreviousDay.setDate(shiftStart.getDate() - 1)
  let total = 0

  for (let index = 0; index < 4; index += 1) {
    const baseDay = new Date(startsPreviousDay)
    baseDay.setDate(startsPreviousDay.getDate() + index)

    const windowStart = new Date(baseDay)
    windowStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)

    const windowEnd = new Date(baseDay)
    windowEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)

    if (endMinutes <= startMinutes) {
      windowEnd.setDate(windowEnd.getDate() + 1)
    }

    total += getOverlapHours(shiftStart, shiftEnd, windowStart, windowEnd)
  }

  return total
}

function getActiveNightRanges(rules: WorkRules, nightPayRanges: NightPayRange[]) {
  if (nightPayRanges.length > 0) {
    return nightPayRanges
  }

  return [
    {
      id: 'default',
      user_id: rules.user_id,
      start_time: rules.night_start,
      end_time: rules.night_end,
      hour_rate: Number(rules.night_hour_rate || 0),
    },
  ]
}

export function buildSummary(
  shifts: WorkShift[],
  rules: WorkRules,
  holidayDates: string[],
  deductions: PayrollDeduction[],
  nightPayRanges: NightPayRange[] = [],
  payrollAdditions: PayrollAddition[] = [],
) {
  const holidaySet = new Set(holidayDates)
  const workedShifts = shifts.filter((shift) => !shift.is_time_off)
  const totalHours = shifts.reduce((total, shift) => total + getShiftHours(shift), 0)
  const contractHours = Number(rules.contract_hours || rules.monthly_extra_hours || 0)
  const complementaryHours = Math.max(0, totalHours - contractHours)
  const activeNightRanges = getActiveNightRanges(rules, nightPayRanges)
  const nightRangeRows = activeNightRanges.map((range) => {
    const hours = shifts.reduce((total, shift) => total + getNightHours(shift, range.start_time, range.end_time), 0)
    const rate = Number(range.hour_rate || 0)

    return {
      ...range,
      hours,
      pay: hours * rate,
    }
  })
  const nightHours = nightRangeRows.reduce((total, range) => total + range.hours, 0)
  const nightPay = nightRangeRows.reduce((total, range) => total + range.pay, 0)
  const holidayShifts = workedShifts.filter((shift) => holidaySet.has(shift.work_date))
  const holidayHours = holidayShifts.reduce((total, shift) => total + getShiftHours(shift), 0)
  const baseSalary = Number(rules.base_salary || 0)
  const complementaryPay = complementaryHours * Number(rules.complementary_hour_rate || 0)
  const holidayPay =
    rules.holiday_pay_mode === 'shift'
      ? holidayShifts.length * Number(rules.holiday_shift_rate || 0)
      : holidayHours * Number(rules.holiday_hour_rate || 0)
  const additionRows = payrollAdditions.map((addition) => {
    const amount = Number(addition.amount || 0)
    const allowedShiftTypeIds = new Set(addition.shift_type_ids ?? [])
    const applicableShifts =
      allowedShiftTypeIds.size > 0 ? workedShifts.filter((shift) => shift.shift_type_id && allowedShiftTypeIds.has(shift.shift_type_id)) : workedShifts
    const applicableHours = applicableShifts.reduce((total, shift) => total + getShiftHours(shift), 0)
    const quantity = addition.mode === 'per_shift' ? applicableShifts.length : addition.mode === 'per_hour' ? applicableHours : 1

    return {
      ...addition,
      applicableShiftCount: applicableShifts.length,
      applicableHours,
      quantity,
      total: amount * quantity,
    }
  })
  const additionsPay = additionRows.reduce((total, addition) => total + addition.total, 0)
  const grossSalary = baseSalary + complementaryPay + nightPay + holidayPay + additionsPay
  const deductionRows = deductions.map((deduction) => ({
    ...deduction,
    amount: grossSalary * (Number(deduction.percentage || 0) / 100),
  }))
  const totalDeductions = deductionRows.reduce((total, deduction) => total + deduction.amount, 0)

  return {
    totalHours,
    contractHours,
    complementaryHours,
    workedShiftCount: workedShifts.length,
    nightHours,
    nightPay,
    nightRangeRows,
    holidayHours,
    holidayShiftCount: holidayShifts.length,
    baseSalary,
    complementaryPay,
    holidayPay,
    additionRows,
    additionsPay,
    grossSalary,
    deductionRows,
    totalDeductions,
    estimatedNetSalary: grossSalary - totalDeductions,
  }
}

export type PayrollSummary = ReturnType<typeof buildSummary>

export function getShiftTitle(shift: WorkShift) {
  return shift.title || 'Turno'
}

export function getShiftColor(shift: WorkShift) {
  return shift.color || '#2563EB'
}

export function getShiftIconId(shift: WorkShift): ShiftIconId {
  return shift.icon || 'briefcase'
}
