import { useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { colorOptions, defaultShiftIcon, defaultWorkRules } from '../constants'
import { getAutomaticHolidayDates } from '../data/holidays'
import type {
  AdminStats,
  AppTab,
  CalendarViewMode,
  LocalHoliday,
  NightPayRange,
  PayrollAddition,
  PayrollAdditionMode,
  PayrollDeduction,
  SaveShiftPayload,
  ShiftActionMode,
  ShiftIconId,
  ShiftType,
  WorkRules,
  WorkShift,
} from '../types'
import { dateFromKey, getMonthRange, getMonthTitle, getVisibleShiftRange, normalizeTime, parseShiftDateTime, toDateKey } from '../utils/dates'
import { buildSummary, formatNumber, getShiftColor, getShiftHours, getShiftIconId, getShiftTitle, parseNumber } from '../utils/payroll'

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isValidDateKey(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false
  }

  const parsedDate = dateFromKey(dateKey)
  return !Number.isNaN(parsedDate.getTime()) && toDateKey(parsedDate) === dateKey
}

export function useWorkdayController(session: Session | null) {
  const [activeTab, setActiveTab] = useState<AppTab>('calendar')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('month')
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [workRules, setWorkRules] = useState<WorkRules>(defaultWorkRules)
  const [localHolidays, setLocalHolidays] = useState<LocalHoliday[]>([])
  const [nightPayRanges, setNightPayRanges] = useState<NightPayRange[]>([])
  const [payrollAdditions, setPayrollAdditions] = useState<PayrollAddition[]>([])
  const [deductions, setDeductions] = useState<PayrollDeduction[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [savingShift, setSavingShift] = useState(false)
  const [savingWorkRules, setSavingWorkRules] = useState(false)
  const [savingDeduction, setSavingDeduction] = useState(false)
  const [savingAddition, setSavingAddition] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [shiftActionMode, setShiftActionMode] = useState<ShiftActionMode>(null)
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null)
  const [editingAdditionId, setEditingAdditionId] = useState<string | null>(null)
  const [shiftTitle, setShiftTitle] = useState('Turno')
  const [shiftColor, setShiftColor] = useState(colorOptions[0])
  const [shiftIcon, setShiftIcon] = useState<ShiftIconId>(defaultShiftIcon)
  const [shiftIsTimeOff, setShiftIsTimeOff] = useState(false)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')
  const [breakMinutes, setBreakMinutes] = useState('0')
  const [shiftNotes, setShiftNotes] = useState('')
  const [templateName, setTemplateName] = useState('Mañana')
  const [templateColor, setTemplateColor] = useState(colorOptions[0])
  const [templateIcon, setTemplateIcon] = useState<ShiftIconId>(defaultShiftIcon)
  const [templateIsTimeOff, setTemplateIsTimeOff] = useState(false)
  const [templateStart, setTemplateStart] = useState('08:00')
  const [templateEnd, setTemplateEnd] = useState('16:00')
  const [deductionName, setDeductionName] = useState('IRPF')
  const [deductionPercentage, setDeductionPercentage] = useState('0')
  const [additionName, setAdditionName] = useState('Limpieza de ropa')
  const [additionAmount, setAdditionAmount] = useState('0')
  const [additionMode, setAdditionMode] = useState<PayrollAdditionMode>('per_shift')
  const [localHolidayDateInput, setLocalHolidayDateInput] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)

  const localHolidayDates = useMemo(() => localHolidays.map((holiday) => holiday.holiday_date), [localHolidays])
  const automaticHolidayDates = useMemo(() => getAutomaticHolidayDates(workRules.autonomous_community), [workRules.autonomous_community])
  const holidayDates = useMemo(() => Array.from(new Set([...automaticHolidayDates, ...localHolidayDates])), [automaticHolidayDates, localHolidayDates])
  const monthTitle = getMonthTitle(currentMonth)
  const selectedDateShifts = useMemo(() => shifts.filter((shift) => shift.work_date === selectedDate), [selectedDate, shifts])
  const visibleHours = useMemo(() => shifts.reduce((total, shift) => total + getShiftHours(shift), 0), [shifts])
  const payrollSummary = useMemo(
    () => buildSummary(shifts, workRules, holidayDates, deductions, nightPayRanges, payrollAdditions),
    [deductions, holidayDates, nightPayRanges, payrollAdditions, shifts, workRules],
  )
  const greetingName = useMemo(() => session?.user.user_metadata?.full_name || session?.user.email || 'usuario', [session])

  useEffect(() => {
    if (!session) {
      setShifts([])
      setShiftTypes([])
      setWorkRules(defaultWorkRules)
      setLocalHolidays([])
      setNightPayRanges([])
      setPayrollAdditions([])
      setDeductions([])
      setIsAdmin(false)
      setAdminStats(null)
      return
    }

    loadShiftTypes()
    loadWorkRules()
    loadNightPayRanges()
    loadPayrollAdditions()
    loadPayrollDeductions()
    loadLocalHolidays()
    loadAdminState()
  }, [session])

  useEffect(() => {
    if (!session) {
      return
    }

    loadVisibleShifts()
  }, [activeTab, calendarView, currentMonth, selectedDate, session])

  async function loadVisibleShifts() {
    if (!supabase || !session) {
      return
    }

    const { start, end } = activeTab === 'summary' ? getMonthRange(currentMonth) : getVisibleShiftRange(calendarView, currentMonth, selectedDate)
    setCalendarLoading(true)
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('work_date', start)
      .lte('work_date', end)
      .order('work_date', { ascending: true })
      .order('start_at', { ascending: true })
    setCalendarLoading(false)

    if (error) {
      Alert.alert('No se pudieron cargar los turnos', error.message)
      return
    }

    setShifts((data ?? []) as WorkShift[])
  }

  async function loadShiftTypes() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      Alert.alert('No se pudieron cargar tus turnos guardados', error.message)
      return
    }

    setShiftTypes((data ?? []) as ShiftType[])
  }

  async function loadWorkRules() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase.from('work_rules').select('*').eq('user_id', session.user.id).single()

    if (error) {
      return
    }

    setWorkRules({
      ...defaultWorkRules,
      ...(data as WorkRules),
      user_id: session.user.id,
      autonomous_community: data?.autonomous_community ?? '',
      holiday_pay_mode: data?.holiday_pay_mode === 'shift' ? 'shift' : 'hour',
      contract_hours: Number(data?.contract_hours ?? data?.monthly_extra_hours ?? 160),
      monthly_extra_hours: Number(data?.monthly_extra_hours ?? data?.contract_hours ?? 160),
      base_salary: Number(data?.base_salary ?? 0),
      complementary_hour_rate: Number(data?.complementary_hour_rate ?? data?.extra_rate ?? 0),
      night_hour_rate: Number(data?.night_hour_rate ?? data?.night_rate ?? 0),
      holiday_hour_rate: Number(data?.holiday_hour_rate ?? data?.holiday_rate ?? 0),
      holiday_shift_rate: Number(data?.holiday_shift_rate ?? 0),
    })
  }

  async function loadNightPayRanges() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase.from('night_pay_ranges').select('*').eq('user_id', session.user.id).order('start_time', { ascending: true })

    if (error) {
      setNightPayRanges([])
      return
    }

    setNightPayRanges((data ?? []) as NightPayRange[])
  }

  async function saveWorkRules() {
    if (!supabase || !session) {
      return
    }

    setSavingWorkRules(true)
    const { error } = await supabase.from('work_rules').upsert(
      {
        user_id: session.user.id,
        night_start: normalizeTime(nightPayRanges[0]?.start_time ?? workRules.night_start) || '22:00',
        night_end: normalizeTime(nightPayRanges[0]?.end_time ?? workRules.night_end) || '06:00',
        monthly_extra_hours: Number(workRules.contract_hours || 0),
        contract_hours: Number(workRules.contract_hours || 0),
        base_salary: Number(workRules.base_salary || 0),
        complementary_hour_rate: Number(workRules.complementary_hour_rate || 0),
        night_hour_rate: Number(nightPayRanges[0]?.hour_rate ?? workRules.night_hour_rate ?? 0),
        holiday_hour_rate: Number(workRules.holiday_hour_rate || 0),
        holiday_shift_rate: Number(workRules.holiday_shift_rate || 0),
        holiday_pay_mode: workRules.holiday_pay_mode,
        autonomous_community: workRules.autonomous_community || null,
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      setSavingWorkRules(false)
      Alert.alert('No se pudieron guardar los ajustes', error.message)
      return
    }

    const deleteRangesResult = await supabase.from('night_pay_ranges').delete().eq('user_id', session.user.id)

    if (deleteRangesResult.error) {
      setSavingWorkRules(false)
      Alert.alert('Falta actualizar la base de datos', 'Ejecuta la migración nueva de nocturnidad en Supabase.')
      return
    }

    const cleanRanges = nightPayRanges
      .map((range) => ({
        user_id: session.user.id,
        start_time: normalizeTime(range.start_time) || '22:00',
        end_time: normalizeTime(range.end_time) || '06:00',
        hour_rate: Number(range.hour_rate || 0),
      }))
      .filter((range) => range.start_time && range.end_time)

    if (cleanRanges.length > 0) {
      const insertRangesResult = await supabase.from('night_pay_ranges').insert(cleanRanges).select('*')

      if (insertRangesResult.error) {
        setSavingWorkRules(false)
        Alert.alert('No se pudieron guardar los tramos nocturnos', insertRangesResult.error.message)
        return
      }

      setNightPayRanges((insertRangesResult.data ?? []) as NightPayRange[])
    }

    setSavingWorkRules(false)
    Alert.alert('Ajustes guardados', 'El resumen usará esta configuración.')
  }

  function addNightRange() {
    setNightPayRanges((currentRanges) => [
      ...currentRanges,
      {
        id: createDraftId('night'),
        user_id: session?.user.id ?? '',
        start_time: '22:00',
        end_time: '06:00',
        hour_rate: 0,
      },
    ])
  }

  function updateNightRange(rangeId: string, patch: Partial<Pick<NightPayRange, 'end_time' | 'hour_rate' | 'start_time'>>) {
    setNightPayRanges((currentRanges) => currentRanges.map((range) => (range.id === rangeId ? { ...range, ...patch } : range)))
  }

  function removeNightRange(rangeId: string) {
    setNightPayRanges((currentRanges) => currentRanges.filter((range) => range.id !== rangeId))
  }

  async function loadPayrollDeductions() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase
      .from('payroll_deductions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      return
    }

    setDeductions((data ?? []) as PayrollDeduction[])
  }

  async function loadPayrollAdditions() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase
      .from('payroll_additions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      setPayrollAdditions([])
      return
    }

    setPayrollAdditions((data ?? []) as PayrollAddition[])
  }

  async function saveAddition() {
    if (!supabase || !session) {
      return
    }

    const cleanName = additionName.trim()
    const cleanAmount = parseNumber(additionAmount)

    if (!cleanName) {
      Alert.alert('Falta nombre', 'Pon un nombre al concepto.')
      return
    }

    if (cleanAmount < 0) {
      Alert.alert('Cantidad no válida', 'Pon una cantidad igual o mayor que 0.')
      return
    }

    setSavingAddition(true)
    const payload = {
      user_id: session.user.id,
      name: cleanName,
      amount: cleanAmount,
      mode: additionMode,
    }
    const query = editingAdditionId
      ? supabase.from('payroll_additions').update(payload).eq('id', editingAdditionId).eq('user_id', session.user.id).select('*').single()
      : supabase.from('payroll_additions').insert(payload).select('*').single()

    const { data, error } = await query
    setSavingAddition(false)

    if (error) {
      Alert.alert('No se pudo guardar el concepto', error.message)
      return
    }

    const savedAddition = data as PayrollAddition
    setPayrollAdditions((currentAdditions) => {
      if (editingAdditionId) {
        return currentAdditions.map((addition) => (addition.id === editingAdditionId ? savedAddition : addition))
      }

      return [...currentAdditions, savedAddition]
    })
    setEditingAdditionId(null)
    setAdditionName('Limpieza de ropa')
    setAdditionAmount('0')
    setAdditionMode('per_shift')
  }

  function startEditAddition(addition: PayrollAddition) {
    setEditingAdditionId(addition.id)
    setAdditionName(addition.name)
    setAdditionAmount(formatNumber(Number(addition.amount || 0)))
    setAdditionMode(addition.mode)
  }

  async function deleteAddition(additionId: string) {
    if (!supabase || !session) {
      return
    }

    const { error } = await supabase.from('payroll_additions').delete().eq('id', additionId).eq('user_id', session.user.id)

    if (error) {
      Alert.alert('No se pudo borrar el concepto', error.message)
      return
    }

    setPayrollAdditions((currentAdditions) => currentAdditions.filter((addition) => addition.id !== additionId))
  }

  async function saveDeduction() {
    if (!supabase || !session) {
      return
    }

    const cleanName = deductionName.trim()
    const cleanPercentage = parseNumber(deductionPercentage)

    if (!cleanName) {
      Alert.alert('Falta nombre', 'Pon un nombre a la deducción.')
      return
    }

    if (cleanPercentage < 0 || cleanPercentage > 100) {
      Alert.alert('Porcentaje no válido', 'Pon un porcentaje entre 0 y 100.')
      return
    }

    setSavingDeduction(true)
    const payload = {
      user_id: session.user.id,
      name: cleanName,
      percentage: cleanPercentage,
    }
    const query = editingDeductionId
      ? supabase.from('payroll_deductions').update(payload).eq('id', editingDeductionId).eq('user_id', session.user.id).select('*').single()
      : supabase.from('payroll_deductions').insert(payload).select('*').single()

    const { data, error } = await query
    setSavingDeduction(false)

    if (error) {
      Alert.alert('No se pudo guardar la deducción', error.message)
      return
    }

    const savedDeduction = data as PayrollDeduction
    setDeductions((currentDeductions) => {
      if (editingDeductionId) {
        return currentDeductions.map((deduction) => (deduction.id === editingDeductionId ? savedDeduction : deduction))
      }

      return [...currentDeductions, savedDeduction]
    })
    setEditingDeductionId(null)
    setDeductionName('IRPF')
    setDeductionPercentage('0')
  }

  function startEditDeduction(deduction: PayrollDeduction) {
    setEditingDeductionId(deduction.id)
    setDeductionName(deduction.name)
    setDeductionPercentage(formatNumber(Number(deduction.percentage || 0)))
  }

  async function deleteDeduction(deductionId: string) {
    if (!supabase || !session) {
      return
    }

    const { error } = await supabase.from('payroll_deductions').delete().eq('id', deductionId).eq('user_id', session.user.id)

    if (error) {
      Alert.alert('No se pudo borrar la deducción', error.message)
      return
    }

    setDeductions((currentDeductions) => currentDeductions.filter((deduction) => deduction.id !== deductionId))
  }

  async function loadLocalHolidays() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase.from('holidays').select('*').eq('user_id', session.user.id).order('holiday_date', { ascending: true })

    if (error) {
      setLocalHolidays([])
      return
    }

    setLocalHolidays((data ?? []) as LocalHoliday[])
  }

  async function addLocalHoliday() {
    if (!supabase || !session) {
      return
    }

    const cleanDate = localHolidayDateInput.trim()

    if (!isValidDateKey(cleanDate)) {
      Alert.alert('Fecha no válida', 'Usa el formato 2026-05-15.')
      return
    }

    if (localHolidayDates.includes(cleanDate)) {
      Alert.alert('Festivo repetido', 'Ese festivo local ya está añadido.')
      return
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert({
        user_id: session.user.id,
        holiday_date: cleanDate,
      })
      .select('*')
      .single()

    if (error) {
      Alert.alert('No se pudo añadir el festivo local', error.message)
      return
    }

    setLocalHolidays((currentHolidays) => [...currentHolidays, data as LocalHoliday].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date)))
    setLocalHolidayDateInput('')
  }

  async function deleteLocalHoliday(holidayId: string) {
    if (!supabase || !session) {
      return
    }

    const { error } = await supabase.from('holidays').delete().eq('id', holidayId).eq('user_id', session.user.id)

    if (error) {
      Alert.alert('No se pudo borrar el festivo local', error.message)
      return
    }

    setLocalHolidays((currentHolidays) => currentHolidays.filter((holiday) => holiday.id !== holidayId))
  }

  async function loadAdminState() {
    if (!supabase || !session) {
      return
    }

    const { data, error } = await supabase.rpc('is_admin')

    if (error) {
      setIsAdmin(false)
      setAdminStats(null)
      return
    }

    const nextIsAdmin = Boolean(data)
    setIsAdmin(nextIsAdmin)

    if (nextIsAdmin) {
      await loadAdminStats()
    }
  }

  async function loadAdminStats() {
    if (!supabase) {
      return
    }

    setAdminLoading(true)
    const [profilesResult, shiftsResult, shiftTypesResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('shifts').select('id', { count: 'exact', head: true }),
      supabase.from('shift_types').select('id', { count: 'exact', head: true }),
    ])
    setAdminLoading(false)

    if (profilesResult.error || shiftsResult.error || shiftTypesResult.error) {
      Alert.alert('Panel admin no disponible', 'Ejecuta primero el SQL de administrador en Supabase.')
      return
    }

    setAdminStats({
      profiles: profilesResult.count ?? 0,
      shifts: shiftsResult.count ?? 0,
      shiftTypes: shiftTypesResult.count ?? 0,
    })
  }

  function changeMonth(monthOffset: number) {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    setCurrentMonth(nextMonth)
    setSelectedDate(toDateKey(nextMonth))
  }

  function selectCalendarDate(dateKey: string) {
    const nextDate = dateFromKey(dateKey)
    setSelectedDate(dateKey)
    setShiftActionMode(null)
    setEditingShiftId(null)

    if (nextDate.getMonth() !== currentMonth.getMonth() || nextDate.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1))
    }
  }

  function resetShiftForm() {
    setEditingShiftId(null)
    setShiftTitle('Turno')
    setShiftColor(colorOptions[0])
    setShiftIcon(defaultShiftIcon)
    setShiftIsTimeOff(false)
    setStartTime('08:00')
    setEndTime('16:00')
    setBreakMinutes('0')
    setShiftNotes('')
  }

  function startCreateShift() {
    resetShiftForm()
    setShiftActionMode('create')
  }

  function startAddShift() {
    setEditingShiftId(null)
    setShiftActionMode('add')
  }

  function startEditShift(shift: WorkShift) {
    setShiftActionMode('create')
    setEditingShiftId(shift.id)
    setShiftTitle(getShiftTitle(shift))
    setShiftColor(getShiftColor(shift))
    setShiftIcon(getShiftIconId(shift))
    setShiftIsTimeOff(Boolean(shift.is_time_off))
    setStartTime(new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.start_at)))
    setEndTime(new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.end_at)))
    setBreakMinutes(String(shift.break_minutes))
    setShiftNotes(shift.notes ?? '')
  }

  async function saveShiftInstance(data: SaveShiftPayload) {
    if (!supabase || !session) {
      return
    }

    let shiftStart = parseShiftDateTime(selectedDate, data.start)
    let shiftEnd = parseShiftDateTime(selectedDate, data.end)
    const cleanBreakMinutes = data.isTimeOff ? 0 : Number.parseInt(data.breakValue.trim() || '0', 10)

    if (!data.title.trim()) {
      Alert.alert('Falta nombre', 'Pon un nombre al turno.')
      return
    }

    if (data.isTimeOff) {
      shiftStart = dateFromKey(selectedDate)
      shiftEnd = dateFromKey(selectedDate)
      shiftEnd.setHours(23, 59, 0, 0)
    }

    if (!shiftStart || !shiftEnd) {
      Alert.alert('Hora no válida', 'Usa el formato 08:00 o 22:30.')
      return
    }

    if (Number.isNaN(cleanBreakMinutes) || cleanBreakMinutes < 0) {
      Alert.alert('Descanso no válido', 'Introduce los minutos de descanso como número.')
      return
    }

    if (!data.isTimeOff && shiftEnd <= shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1)
    }

    setSavingShift(true)
    const payload = {
      user_id: session.user.id,
      shift_type_id: data.shiftTypeId ?? null,
      title: data.title.trim(),
      color: data.color,
      icon: data.icon,
      is_time_off: data.isTimeOff,
      work_date: selectedDate,
      start_at: shiftStart.toISOString(),
      end_at: shiftEnd.toISOString(),
      break_minutes: cleanBreakMinutes,
      notes: data.notes.trim() || null,
    }
    const query = editingShiftId
      ? supabase.from('shifts').update(payload).eq('id', editingShiftId).eq('user_id', session.user.id).select('*').single()
      : supabase.from('shifts').insert(payload).select('*').single()

    const { data: savedShift, error } = await query
    setSavingShift(false)

    if (error) {
      Alert.alert('No se pudo guardar el turno', error.message)
      return
    }

    const nextShift = savedShift as WorkShift
    setShifts((currentShifts) => {
      if (editingShiftId) {
        return currentShifts.map((shift) => (shift.id === editingShiftId ? nextShift : shift))
      }

      return [...currentShifts, nextShift]
    })
    resetShiftForm()
    setShiftActionMode(null)
  }

  async function handleDeleteShift(shiftId: string) {
    if (!supabase || !session) {
      return
    }

    const { error } = await supabase.from('shifts').delete().eq('id', shiftId).eq('user_id', session.user.id)

    if (error) {
      Alert.alert('No se pudo borrar el turno', error.message)
      return
    }

    setShifts((currentShifts) => currentShifts.filter((shift) => shift.id !== shiftId))
  }

  async function handleSaveTemplate() {
    if (!supabase || !session) {
      return
    }

    const cleanName = templateName.trim()

    if (!cleanName) {
      Alert.alert('Falta nombre', 'Pon un nombre al turno guardado.')
      return
    }

    if (!templateIsTimeOff && (!parseShiftDateTime(selectedDate, templateStart) || !parseShiftDateTime(selectedDate, templateEnd))) {
      Alert.alert('Hora no válida', 'Usa el formato 08:00 o 22:30.')
      return
    }

    setSavingTemplate(true)
    const payload = {
      user_id: session.user.id,
      name: cleanName,
      color: templateColor,
      icon: templateIcon,
      is_time_off: templateIsTimeOff,
      default_start_time: templateIsTimeOff ? null : templateStart,
      default_end_time: templateIsTimeOff ? null : templateEnd,
    }
    const query = editingTemplateId
      ? supabase.from('shift_types').update(payload).eq('id', editingTemplateId).eq('user_id', session.user.id).select('*').single()
      : supabase.from('shift_types').insert(payload).select('*').single()

    const { data, error } = await query
    setSavingTemplate(false)

    if (error) {
      Alert.alert('No se pudo guardar el turno', error.message)
      return
    }

    const savedTemplate = data as ShiftType
    setShiftTypes((currentTypes) => {
      if (editingTemplateId) {
        return currentTypes.map((type) => (type.id === editingTemplateId ? savedTemplate : type))
      }

      return [...currentTypes, savedTemplate]
    })
    setEditingTemplateId(null)
    setTemplateName('Mañana')
    setTemplateColor(colorOptions[0])
    setTemplateIcon(defaultShiftIcon)
    setTemplateIsTimeOff(false)
    setTemplateStart('08:00')
    setTemplateEnd('16:00')
  }

  function startEditTemplate(template: ShiftType) {
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateColor(template.color)
    setTemplateIcon(template.icon || defaultShiftIcon)
    setTemplateIsTimeOff(Boolean(template.is_time_off))
    setTemplateStart(normalizeTime(template.default_start_time) || '08:00')
    setTemplateEnd(normalizeTime(template.default_end_time) || '16:00')
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!supabase || !session) {
      return
    }

    const { error } = await supabase.from('shift_types').delete().eq('id', templateId).eq('user_id', session.user.id)

    if (error) {
      Alert.alert('No se pudo borrar el turno guardado', error.message)
      return
    }

    setShiftTypes((currentTypes) => currentTypes.filter((type) => type.id !== templateId))
  }

  return {
    activeTab,
    additionAmount,
    additionMode,
    additionName,
    addLocalHoliday,
    addNightRange,
    adminLoading,
    adminStats,
    breakMinutes,
    calendarLoading,
    calendarView,
    changeMonth,
    currentMonth,
    deductionName,
    deductionPercentage,
    deductions,
    deleteDeduction,
    deleteAddition,
    deleteLocalHoliday,
    editingDeductionId,
    editingAdditionId,
    editingShiftId,
    editingTemplateId,
    endTime,
    greetingName,
    handleDeleteShift,
    handleDeleteTemplate,
    handleSaveTemplate,
    holidayDates,
    isAdmin,
    loadAdminStats,
    localHolidayDateInput,
    localHolidayDates,
    localHolidays,
    monthTitle,
    nightPayRanges,
    payrollSummary,
    payrollAdditions,
    removeNightRange,
    saveDeduction,
    saveAddition,
    saveShiftInstance,
    saveWorkRules,
    savingDeduction,
    savingAddition,
    savingShift,
    savingTemplate,
    savingWorkRules,
    selectCalendarDate,
    selectedDate,
    selectedDateShifts,
    setActiveTab,
    setAdditionAmount,
    setAdditionMode,
    setAdditionName,
    setBreakMinutes,
    setCalendarView,
    setCurrentMonth,
    setDeductionName,
    setDeductionPercentage,
    setEndTime,
    setLocalHolidayDateInput,
    setSelectedDate,
    setShiftActionMode,
    setShiftColor,
    setShiftIcon,
    setShiftIsTimeOff,
    setShiftNotes,
    setShiftTitle,
    setStartTime,
    setTemplateColor,
    setTemplateEnd,
    setTemplateIcon,
    setTemplateIsTimeOff,
    setTemplateName,
    setTemplateStart,
    setWorkRules,
    shiftActionMode,
    shiftColor,
    shiftIcon,
    shiftIsTimeOff,
    shiftNotes,
    shifts,
    shiftTitle,
    shiftTypes,
    startAddShift,
    startEditAddition,
    startCreateShift,
    startEditDeduction,
    startEditShift,
    startEditTemplate,
    startTime,
    templateColor,
    templateEnd,
    templateIcon,
    templateIsTimeOff,
    templateName,
    templateStart,
    updateNightRange,
    visibleHours,
    workRules,
  }
}

export type WorkdayController = ReturnType<typeof useWorkdayController>
