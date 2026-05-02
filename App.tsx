import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native'
import type { Session } from '@supabase/supabase-js'
import {
  BarChart3,
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react-native'
import { supabase, supabaseConfigError } from './lib/supabase'

type ThemeMode = 'light' | 'dark'
type AppTab = 'summary' | 'settings' | 'calendar' | 'shiftTypes' | 'profile'
type CalendarViewMode = 'month' | 'week' | 'day' | 'year'
type ShiftActionMode = 'create' | 'add' | null

type WorkShift = {
  id: string
  user_id: string
  shift_type_id: string | null
  title: string | null
  color: string | null
  work_date: string
  start_at: string
  end_at: string
  break_minutes: number
  notes: string | null
}

type ShiftType = {
  id: string
  user_id: string
  name: string
  color: string
  default_start_time: string | null
  default_end_time: string | null
}

type AppColors = (typeof palettes)[ThemeMode]

const palettes = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSoft: '#F4F7FC',
    text: '#050816',
    muted: '#526070',
    blue: '#0B57D0',
    blueStrong: '#0643A3',
    border: '#D8E2F0',
    input: '#F8FBFF',
    segment: '#E7EEF8',
    shadow: '#071225',
  },
  dark: {
    background: '#050816',
    surface: '#0B1220',
    surfaceSoft: '#111827',
    text: '#FFFFFF',
    muted: '#C8D3E1',
    blue: '#60A5FA',
    blueStrong: '#2563EB',
    border: '#1F2A44',
    input: '#0F172A',
    segment: '#172033',
    shadow: '#000000',
  },
}

const monthNames = [
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

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const calendarViews: { id: CalendarViewMode; label: string }[] = [
  { id: 'month', label: 'Mes' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Dia' },
  { id: 'year', label: 'Ano' },
]

const colorOptions = ['#2563EB', '#0EA5E9', '#22C55E', '#F97316', '#EF4444', '#8B5CF6', '#111827']

function padNumber(value: number) {
  return value.toString().padStart(2, '0')
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(dateKey: string, days: number) {
  const date = dateFromKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function getMonthRange(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  }
}

function getVisibleShiftRange(viewMode: CalendarViewMode, monthDate: Date, dateKey: string) {
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

function buildCalendarDays(monthDate: Date, shifts: WorkShift[]) {
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

function buildWeekDays(dateKey: string, shifts: WorkShift[]) {
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

function parseShiftDateTime(dateKey: string, timeText: string) {
  const match = timeText.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/)

  if (!match) {
    return null
  }

  const date = dateFromKey(dateKey)
  date.setHours(Number(match[1]), Number(match[2]), 0, 0)

  return date
}

function normalizeTime(time: string | null) {
  return time ? time.slice(0, 5) : ''
}

function formatTime(isoDate: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromKey(dateKey))
}

function getShiftHours(shift: WorkShift) {
  const start = new Date(shift.start_at).getTime()
  const end = new Date(shift.end_at).getTime()
  const breakHours = shift.break_minutes / 60

  return Math.max(0, (end - start) / 36e5 - breakHours)
}

function getShiftTitle(shift: WorkShift) {
  return shift.title || 'Turno'
}

function getShiftColor(shift: WorkShift) {
  return shift.color || '#2563EB'
}

export default function App() {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (systemScheme === 'dark' ? 'dark' : 'light'))
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<AppTab>('calendar')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('month')
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [savingShift, setSavingShift] = useState(false)
  const [shiftActionMode, setShiftActionMode] = useState<ShiftActionMode>(null)
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null)

  const [shiftTitle, setShiftTitle] = useState('Turno')
  const [shiftColor, setShiftColor] = useState(colorOptions[0])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')
  const [breakMinutes, setBreakMinutes] = useState('0')
  const [shiftNotes, setShiftNotes] = useState('')

  const [templateName, setTemplateName] = useState('Manana')
  const [templateColor, setTemplateColor] = useState(colorOptions[0])
  const [templateStart, setTemplateStart] = useState('08:00')
  const [templateEnd, setTemplateEnd] = useState('16:00')
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)

  const isRegistering = authMode === 'register'
  const title = isRegistering ? 'Crear cuenta' : 'Iniciar sesion'
  const isDark = themeMode === 'dark'
  const colors = palettes[themeMode]
  const styles = useMemo(() => createStyles(colors), [colors])
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth, shifts), [currentMonth, shifts])
  const weekDays = useMemo(() => buildWeekDays(selectedDate, shifts), [selectedDate, shifts])
  const selectedDateShifts = useMemo(() => shifts.filter((shift) => shift.work_date === selectedDate), [selectedDate, shifts])
  const visibleHours = useMemo(() => shifts.reduce((total, shift) => total + getShiftHours(shift), 0), [shifts])
  const monthTitle = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
  const activeTabTitle = {
    summary: 'Resumen',
    settings: 'Ajustes',
    calendar: 'Calendario',
    shiftTypes: 'Turnos',
    profile: 'Perfil',
  }[activeTab]
  const bottomTabs = [
    { id: 'summary' as const, label: 'Resumen', Icon: BarChart3 },
    { id: 'settings' as const, label: 'Ajustes', Icon: Settings },
    { id: 'calendar' as const, label: 'Calendario', Icon: CalendarDays },
    { id: 'shiftTypes' as const, label: 'Turnos', Icon: SlidersHorizontal },
    { id: 'profile' as const, label: 'Perfil', Icon: UserRound },
  ]
  const greetingName = useMemo(() => {
    return session?.user.user_metadata?.full_name || session?.user.email || 'usuario'
  }, [session])

  useEffect(() => {
    if (!supabase) {
      setInitializing(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitializing(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        ensureUserDefaults(nextSession.user.id, nextSession.user.email ?? '', nextSession.user.user_metadata?.full_name)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setShifts([])
      setShiftTypes([])
      return
    }

    loadShiftTypes()
  }, [session])

  useEffect(() => {
    if (!session) {
      return
    }

    loadVisibleShifts()
  }, [calendarView, currentMonth, selectedDate, session])

  async function ensureUserDefaults(userId: string, userEmail: string, userFullName?: string) {
    if (!supabase) {
      return
    }

    await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      full_name: userFullName ?? null,
    })

    await supabase.from('work_rules').upsert(
      {
        user_id: userId,
        night_start: '22:00',
        night_end: '06:00',
        monthly_extra_hours: 160,
      },
      { onConflict: 'user_id' },
    )
  }

  async function handleSubmit() {
    if (!supabase) {
      Alert.alert('Falta configuracion', supabaseConfigError ?? 'No se pudo conectar con Supabase.')
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()

    if (!cleanEmail || !password) {
      Alert.alert('Faltan datos', 'Introduce correo y contrasena.')
      return
    }

    if (password.length < 6) {
      Alert.alert('Contrasena corta', 'La contrasena debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const response = isRegistering
      ? await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName || null,
            },
          },
        })
      : await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

    setLoading(false)

    if (response.error) {
      Alert.alert('No se pudo continuar', response.error.message)
      return
    }

    if (isRegistering && !response.data.session) {
      Alert.alert('Revisa tu correo', 'Supabase te ha enviado un correo para confirmar tu cuenta.')
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  async function loadVisibleShifts() {
    if (!supabase || !session) {
      return
    }

    const { start, end } = getVisibleShiftRange(calendarView, currentMonth, selectedDate)

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
    setStartTime(formatTime(shift.start_at))
    setEndTime(formatTime(shift.end_at))
    setBreakMinutes(String(shift.break_minutes))
    setShiftNotes(shift.notes ?? '')
  }

  async function saveShiftInstance(data: {
    title: string
    color: string
    start: string
    end: string
    breakValue: string
    notes: string
    shiftTypeId?: string | null
  }) {
    if (!supabase || !session) {
      return
    }

    const shiftStart = parseShiftDateTime(selectedDate, data.start)
    const shiftEnd = parseShiftDateTime(selectedDate, data.end)
    const cleanBreakMinutes = Number.parseInt(data.breakValue.trim() || '0', 10)

    if (!data.title.trim()) {
      Alert.alert('Falta nombre', 'Pon un nombre al turno.')
      return
    }

    if (!shiftStart || !shiftEnd) {
      Alert.alert('Hora no valida', 'Usa el formato 08:00 o 22:30.')
      return
    }

    if (Number.isNaN(cleanBreakMinutes) || cleanBreakMinutes < 0) {
      Alert.alert('Descanso no valido', 'Introduce los minutos de descanso como numero.')
      return
    }

    if (shiftEnd <= shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1)
    }

    setSavingShift(true)

    const payload = {
      user_id: session.user.id,
      shift_type_id: data.shiftTypeId ?? null,
      title: data.title.trim(),
      color: data.color,
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

    if (!parseShiftDateTime(selectedDate, templateStart) || !parseShiftDateTime(selectedDate, templateEnd)) {
      Alert.alert('Hora no valida', 'Usa el formato 08:00 o 22:30.')
      return
    }

    setSavingTemplate(true)

    const payload = {
      user_id: session.user.id,
      name: cleanName,
      color: templateColor,
      default_start_time: templateStart,
      default_end_time: templateEnd,
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
    setTemplateName('Manana')
    setTemplateColor(colorOptions[0])
    setTemplateStart('08:00')
    setTemplateEnd('16:00')
  }

  function startEditTemplate(template: ShiftType) {
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateColor(template.color)
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

  function renderColorPicker(value: string, onChange: (color: string) => void) {
    return (
      <View style={styles.colorRow}>
        {colorOptions.map((color) => (
          <Pressable
            key={color}
            style={[styles.colorSwatch, { backgroundColor: color }, value === color && styles.colorSwatchActive]}
            onPress={() => onChange(color)}
          >
            {value === color ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
          </Pressable>
        ))}
      </View>
    )
  }

  function renderCalendarViewSelector() {
    return (
      <View style={styles.calendarViewSelector}>
        {calendarViews.map((view) => {
          const isActiveView = calendarView === view.id

          return (
            <Pressable
              key={view.id}
              style={[styles.calendarViewButton, isActiveView && styles.calendarViewButtonActive]}
              onPress={() => setCalendarView(view.id)}
            >
              <Text style={[styles.calendarViewText, isActiveView && styles.calendarViewTextActive]}>{view.label}</Text>
            </Pressable>
          )
        })}
      </View>
    )
  }

  function renderMonthCalendar() {
    return (
      <View style={styles.calendarPanel}>
        <View style={styles.monthBar}>
          <Pressable style={styles.iconButton} onPress={() => changeMonth(-1)}>
            <Text style={styles.iconButtonText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Pressable style={styles.iconButton} onPress={() => changeMonth(1)}>
            <Text style={styles.iconButtonText}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.weekHeader}>
          {weekdayLabels.map((weekday) => (
            <Text key={weekday} style={styles.weekdayText}>
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            const isSelected = day.dateKey === selectedDate

            return (
              <Pressable
                key={day.dateKey}
                style={[
                  styles.dayCell,
                  !day.inMonth && styles.dayCellMuted,
                  day.isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => selectCalendarDate(day.dateKey)}
              >
                <Text style={[styles.dayNumber, !day.inMonth && styles.dayNumberMuted, isSelected && styles.dayNumberSelected]}>
                  {day.dayNumber}
                </Text>
                <View style={styles.shiftDots}>
                  {day.shifts.slice(0, 3).map((shift) => (
                    <View key={shift.id} style={[styles.shiftDot, { backgroundColor: getShiftColor(shift) }]} />
                  ))}
                </View>
              </Pressable>
            )
          })}
        </View>

        {calendarLoading ? <Text style={styles.loadingText}>Cargando turnos...</Text> : null}
      </View>
    )
  }

  function renderWeekCalendar() {
    return (
      <View style={styles.calendarPanel}>
        <View style={styles.monthBar}>
          <Pressable style={styles.iconButton} onPress={() => selectCalendarDate(addDays(selectedDate, -7))}>
            <Text style={styles.iconButtonText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.monthTitle}>Semana</Text>
          <Pressable style={styles.iconButton} onPress={() => selectCalendarDate(addDays(selectedDate, 7))}>
            <Text style={styles.iconButtonText}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.weekStrip}>
          {weekDays.map((day) => {
            const isSelected = day.dateKey === selectedDate

            return (
              <Pressable
                key={day.dateKey}
                style={[styles.weekDayCard, day.isToday && styles.dayCellToday, isSelected && styles.dayCellSelected]}
                onPress={() => selectCalendarDate(day.dateKey)}
              >
                <Text style={[styles.weekDayLabel, isSelected && styles.dayNumberSelected]}>{day.weekday}</Text>
                <Text style={[styles.weekDayNumber, isSelected && styles.dayNumberSelected]}>{day.dayNumber}</Text>
                <Text style={[styles.weekShiftCount, isSelected && styles.dayNumberSelected]}>{day.shifts.length} turnos</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  function renderDayCalendar() {
    return (
      <View style={styles.calendarPanel}>
        <View style={styles.monthBar}>
          <Pressable style={styles.iconButton} onPress={() => selectCalendarDate(addDays(selectedDate, -1))}>
            <Text style={styles.iconButtonText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{formatSelectedDate(selectedDate)}</Text>
          <Pressable style={styles.iconButton} onPress={() => selectCalendarDate(addDays(selectedDate, 1))}>
            <Text style={styles.iconButtonText}>{'>'}</Text>
          </Pressable>
        </View>
        <Text style={styles.dayFocusText}>
          {selectedDateShifts.length > 0
            ? `${selectedDateShifts.length} turno${selectedDateShifts.length === 1 ? '' : 's'} para este dia`
            : 'Dia libre o sin turnos guardados'}
        </Text>
      </View>
    )
  }

  function renderYearCalendar() {
    const year = currentMonth.getFullYear()
    const months = monthNames.map((name, index) => {
      const monthShifts = shifts.filter((shift) => {
        const shiftDate = dateFromKey(shift.work_date)
        return shiftDate.getFullYear() === year && shiftDate.getMonth() === index
      })

      return {
        index,
        name,
        count: monthShifts.length,
        hours: monthShifts.reduce((total, shift) => total + getShiftHours(shift), 0),
      }
    })

    return (
      <View style={styles.calendarPanel}>
        <View style={styles.monthBar}>
          <Pressable style={styles.iconButton} onPress={() => setCurrentMonth(new Date(year - 1, currentMonth.getMonth(), 1))}>
            <Text style={styles.iconButtonText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{year}</Text>
          <Pressable style={styles.iconButton} onPress={() => setCurrentMonth(new Date(year + 1, currentMonth.getMonth(), 1))}>
            <Text style={styles.iconButtonText}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={styles.yearGrid}>
          {months.map((month) => (
            <Pressable
              key={month.name}
              style={styles.yearMonthCard}
              onPress={() => {
                setCurrentMonth(new Date(year, month.index, 1))
                setSelectedDate(`${year}-${padNumber(month.index + 1)}-01`)
                setCalendarView('month')
              }}
            >
              <Text style={styles.yearMonthName}>{month.name.slice(0, 3)}</Text>
              <Text style={styles.yearMonthStats}>{month.count} turnos</Text>
              <Text style={styles.yearMonthHours}>{month.hours.toFixed(0)}h</Text>
            </Pressable>
          ))}
        </View>
      </View>
    )
  }

  function renderShiftCards() {
    if (selectedDateShifts.length === 0) {
      return <Text style={styles.emptyText}>No hay turnos para este dia.</Text>
    }

    return (
      <View style={styles.shiftList}>
        {selectedDateShifts.map((shift) => (
          <View key={shift.id} style={styles.shiftRow}>
            <View style={[styles.shiftColorBar, { backgroundColor: getShiftColor(shift) }]} />
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftTime}>{getShiftTitle(shift)}</Text>
              <Text style={styles.shiftMeta}>
                {formatTime(shift.start_at)} - {formatTime(shift.end_at)} · {getShiftHours(shift).toFixed(1)}h netas
              </Text>
              {shift.notes ? <Text style={styles.shiftNotes}>{shift.notes}</Text> : null}
            </View>
            <View style={styles.rowActions}>
              <Pressable style={styles.smallIconButton} onPress={() => startEditShift(shift)}>
                <Pencil size={16} color={colors.blue} />
              </Pressable>
              <Pressable style={styles.smallIconButton} onPress={() => handleDeleteShift(shift.id)}>
                <Trash2 size={16} color={colors.blue} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    )
  }

  function renderCreateShiftForm() {
    return (
      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>{editingShiftId ? 'Editar turno' : 'Crear turno puntual'}</Text>
        <Text style={styles.helperText}>
          Este turno solo se guarda en este dia. No se anade a la lista de turnos personalizados.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre del turno</Text>
          <TextInput value={shiftTitle} onChangeText={setShiftTitle} style={styles.input} placeholder="Ej. Noche extra" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Color</Text>
          {renderColorPicker(shiftColor, setShiftColor)}
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.label}>Inicio</Text>
            <TextInput value={startTime} onChangeText={setStartTime} style={styles.input} placeholder="08:00" placeholderTextColor="#94A3B8" />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.label}>Fin</Text>
            <TextInput value={endTime} onChangeText={setEndTime} style={styles.input} placeholder="16:00" placeholderTextColor="#94A3B8" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Descanso en minutos</Text>
          <TextInput value={breakMinutes} onChangeText={setBreakMinutes} keyboardType="number-pad" style={styles.input} placeholder="0" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nota</Text>
          <TextInput
            value={shiftNotes}
            onChangeText={setShiftNotes}
            style={[styles.input, styles.notesInput]}
            placeholder="Nota opcional"
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>

        <Pressable
          style={[styles.primaryButton, savingShift && styles.disabledButton]}
          onPress={() =>
            saveShiftInstance({
              title: shiftTitle,
              color: shiftColor,
              start: startTime,
              end: endTime,
              breakValue: breakMinutes,
              notes: shiftNotes,
              shiftTypeId: null,
            })
          }
          disabled={savingShift}
        >
          {savingShift ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingShiftId ? 'Guardar cambios' : 'Guardar turno'}</Text>}
        </Pressable>
      </View>
    )
  }

  function renderAddShiftFromTemplate() {
    return (
      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>Anadir turno guardado</Text>

        {shiftTypes.length === 0 ? (
          <View>
            <Text style={styles.emptyText}>Todavia no tienes turnos personalizados.</Text>
            <Pressable style={styles.primaryButton} onPress={() => setActiveTab('shiftTypes')}>
              <Text style={styles.primaryButtonText}>Crear turnos</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.templateList}>
            {shiftTypes.map((template) => (
              <Pressable
                key={template.id}
                style={styles.templateCard}
                onPress={() =>
                  saveShiftInstance({
                    title: template.name,
                    color: template.color,
                    start: normalizeTime(template.default_start_time) || '08:00',
                    end: normalizeTime(template.default_end_time) || '16:00',
                    breakValue: '0',
                    notes: '',
                    shiftTypeId: template.id,
                  })
                }
              >
                <View style={[styles.templateColor, { backgroundColor: template.color }]} />
                <View style={styles.shiftInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.shiftMeta}>
                    {normalizeTime(template.default_start_time) || '--:--'} - {normalizeTime(template.default_end_time) || '--:--'}
                  </Text>
                </View>
                <Plus size={18} color={colors.blue} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    )
  }

  function renderSelectedDayPanel() {
    return (
      <View style={styles.dayPanel}>
        <Text style={styles.panelEyebrow}>Dia seleccionado</Text>
        <Text style={styles.selectedDateTitle}>{formatSelectedDate(selectedDate)}</Text>

        {renderShiftCards()}

        <View style={styles.actionSplit}>
          <Pressable style={[styles.actionButton, shiftActionMode === 'create' && styles.actionButtonActive]} onPress={startCreateShift}>
            <Text style={[styles.actionButtonText, shiftActionMode === 'create' && styles.actionButtonTextActive]}>Crear turno</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, shiftActionMode === 'add' && styles.actionButtonActive]} onPress={startAddShift}>
            <Text style={[styles.actionButtonText, shiftActionMode === 'add' && styles.actionButtonTextActive]}>Anadir turno</Text>
          </Pressable>
        </View>

        {shiftActionMode === 'create' ? renderCreateShiftForm() : null}
        {shiftActionMode === 'add' ? renderAddShiftFromTemplate() : null}
      </View>
    )
  }

  function renderCalendarScreen() {
    return (
      <>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{visibleHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Horas visibles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{shifts.length}</Text>
            <Text style={styles.statLabel}>Turnos</Text>
          </View>
        </View>

        {renderCalendarViewSelector()}
        {calendarView === 'month' ? renderMonthCalendar() : null}
        {calendarView === 'week' ? renderWeekCalendar() : null}
        {calendarView === 'day' ? renderDayCalendar() : null}
        {calendarView === 'year' ? renderYearCalendar() : null}
        {calendarView !== 'year' ? renderSelectedDayPanel() : null}
      </>
    )
  }

  function renderShiftTypesScreen() {
    return (
      <>
        <View style={styles.formPanel}>
          <Text style={styles.formSectionTitle}>{editingTemplateId ? 'Editar turno personalizado' : 'Crear turno personalizado'}</Text>
          <Text style={styles.helperText}>
            Estos turnos quedan guardados para anadirlos rapido al calendario. Si luego editas uno ya anadido al calendario, no cambia esta plantilla.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput value={templateName} onChangeText={setTemplateName} style={styles.input} placeholder="Ej. Manana" placeholderTextColor="#94A3B8" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Color</Text>
            {renderColorPicker(templateColor, setTemplateColor)}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.label}>Inicio por defecto</Text>
              <TextInput value={templateStart} onChangeText={setTemplateStart} style={styles.input} placeholder="08:00" placeholderTextColor="#94A3B8" />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.label}>Fin por defecto</Text>
              <TextInput value={templateEnd} onChangeText={setTemplateEnd} style={styles.input} placeholder="16:00" placeholderTextColor="#94A3B8" />
            </View>
          </View>

          <Pressable style={[styles.primaryButton, savingTemplate && styles.disabledButton]} onPress={handleSaveTemplate} disabled={savingTemplate}>
            {savingTemplate ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingTemplateId ? 'Guardar plantilla' : 'Crear plantilla'}</Text>}
          </Pressable>
        </View>

        <View style={styles.dayPanel}>
          <Text style={styles.panelEyebrow}>Turnos guardados</Text>
          {shiftTypes.length === 0 ? (
            <Text style={styles.emptyText}>Aun no has creado turnos personalizados.</Text>
          ) : (
            <View style={styles.templateList}>
              {shiftTypes.map((template) => (
                <View key={template.id} style={styles.templateCard}>
                  <View style={[styles.templateColor, { backgroundColor: template.color }]} />
                  <View style={styles.shiftInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.shiftMeta}>
                      {normalizeTime(template.default_start_time) || '--:--'} - {normalizeTime(template.default_end_time) || '--:--'}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable style={styles.smallIconButton} onPress={() => startEditTemplate(template)}>
                      <Pencil size={16} color={colors.blue} />
                    </Pressable>
                    <Pressable style={styles.smallIconButton} onPress={() => handleDeleteTemplate(template.id)}>
                      <Trash2 size={16} color={colors.blue} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </>
    )
  }

  function renderPlaceholderScreen(titleText: string, description: string) {
    return (
      <View style={styles.placeholderPanel}>
        <Text style={styles.placeholderTitle}>{titleText}</Text>
        <Text style={styles.placeholderText}>{description}</Text>
      </View>
    )
  }

  function renderActiveTab() {
    if (activeTab === 'calendar') {
      return renderCalendarScreen()
    }

    if (activeTab === 'shiftTypes') {
      return renderShiftTypesScreen()
    }

    if (activeTab === 'summary') {
      return renderPlaceholderScreen('Resumen', 'Aqui pondremos horas totales, nocturnas, festivos, extras y calculos por mes.')
    }

    if (activeTab === 'settings') {
      return renderPlaceholderScreen('Ajustes', 'Aqui ira la configuracion de la app, soporte, preferencias y modo visual.')
    }

    return renderPlaceholderScreen('Perfil', `Sesion iniciada como ${session?.user.email ?? greetingName}.`)
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.blue} />
      </SafeAreaView>
    )
  }

  if (session) {
    return (
      <SafeAreaView style={styles.appScreen}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.homeHeader}>
              <View style={styles.homeTitleBlock}>
                <Text style={styles.kicker}>MyWorkday</Text>
                <Text style={styles.homeTitle}>{activeTabTitle}</Text>
              </View>
              <View style={styles.homeActions}>
                <Pressable style={styles.modeButton} onPress={() => setThemeMode(isDark ? 'light' : 'dark')}>
                  <Text style={styles.modeButtonText}>{isDark ? 'Claro' : 'Oscuro'}</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
                  <Text style={styles.secondaryButtonText}>Salir</Text>
                </Pressable>
              </View>
            </View>

            {renderActiveTab()}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomNav}>
          {bottomTabs.map(({ id, label, Icon }) => {
            const isActiveTab = activeTab === id
            const isCenterTab = id === 'calendar'

            return (
              <Pressable
                key={id}
                style={[styles.bottomNavItem, isCenterTab && styles.bottomNavCenter, isActiveTab && styles.bottomNavItemActive]}
                onPress={() => setActiveTab(id)}
              >
                <Icon size={isCenterTab ? 27 : 22} color={isActiveTab ? '#FFFFFF' : colors.muted} strokeWidth={2.5} />
                <Text style={[styles.bottomNavLabel, isActiveTab && styles.bottomNavLabelActive]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      </SafeAreaView>
    )
  }

  if (supabaseConfigError) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.configPanel}>
          <Text style={styles.logo}>MyWorkday</Text>
          <Text style={styles.formTitle}>Falta conectar Supabase</Text>
          <Text style={styles.configText}>{supabaseConfigError}</Text>
          <Text style={styles.configCode}>EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co</Text>
          <Text style={styles.configCode}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <Text style={styles.logo}>MyWorkday</Text>
            <Text style={styles.headline}>Organiza tus turnos sin perder la cuenta de tus horas.</Text>
            <View style={styles.themeControl}>
              <Text style={styles.themeText}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
              <Switch
                value={isDark}
                onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')}
                trackColor={{ false: '#CBD5E1', true: colors.blueStrong }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.authPanel}>
            <View style={styles.segmentedControl}>
              <Pressable style={[styles.segmentButton, !isRegistering && styles.segmentButtonActive]} onPress={() => setAuthMode('login')}>
                <Text style={[styles.segmentText, !isRegistering && styles.segmentTextActive]}>Entrar</Text>
              </Pressable>
              <Pressable style={[styles.segmentButton, isRegistering && styles.segmentButtonActive]} onPress={() => setAuthMode('register')}>
                <Text style={[styles.segmentText, isRegistering && styles.segmentTextActive]}>Registro</Text>
              </Pressable>
            </View>

            <Text style={styles.formTitle}>{title}</Text>

            {isRegistering ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput value={fullName} onChangeText={setFullName} placeholder="Tu nombre" placeholderTextColor="#94A3B8" style={styles.input} />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contrasena</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimo 6 caracteres"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{title}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingScreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 28,
      paddingHorizontal: 24,
      paddingTop: 22,
    },
    brandBlock: {
      alignItems: 'center',
      marginBottom: 22,
      width: '100%',
    },
    logo: {
      color: colors.blue,
      fontSize: 36,
      fontWeight: '900',
      marginBottom: 16,
      textAlign: 'center',
      width: '100%',
    },
    headline: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 29,
      marginBottom: 16,
      maxWidth: 360,
      textAlign: 'center',
    },
    themeControl: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    themeText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '800',
    },
    authPanel: {
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      maxWidth: 390,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 26,
      width: '100%',
      elevation: 4,
    },
    segmentedControl: {
      backgroundColor: colors.segment,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 18,
      padding: 4,
    },
    segmentButton: {
      alignItems: 'center',
      borderRadius: 6,
      flex: 1,
      paddingVertical: 11,
    },
    segmentButtonActive: {
      backgroundColor: colors.surface,
    },
    segmentText: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: '800',
    },
    segmentTextActive: {
      color: colors.blue,
    },
    formTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 18,
      textAlign: 'center',
    },
    appScreen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    homeContent: {
      paddingBottom: 28,
      paddingHorizontal: 18,
      paddingTop: 18,
    },
    homeHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    homeTitleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    kicker: {
      color: colors.blue,
      fontSize: 14,
      fontWeight: '900',
      marginBottom: 6,
    },
    homeTitle: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '900',
    },
    homeActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    modeButton: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    modeButtonText: {
      color: colors.blue,
      fontSize: 13,
      fontWeight: '900',
    },
    secondaryButton: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      padding: 14,
    },
    statValue: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 4,
    },
    statLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '800',
    },
    calendarViewSelector: {
      backgroundColor: colors.segment,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 4,
      marginBottom: 14,
      padding: 4,
    },
    calendarViewButton: {
      alignItems: 'center',
      borderRadius: 6,
      flex: 1,
      paddingVertical: 10,
    },
    calendarViewButtonActive: {
      backgroundColor: colors.blueStrong,
    },
    calendarViewText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '900',
    },
    calendarViewTextActive: {
      color: '#FFFFFF',
    },
    calendarPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 14,
      padding: 14,
    },
    monthBar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    iconButtonText: {
      color: colors.blue,
      fontSize: 19,
      fontWeight: '900',
    },
    monthTitle: {
      color: colors.text,
      flex: 1,
      fontSize: 20,
      fontWeight: '900',
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekdayText: {
      color: colors.muted,
      flex: 1,
      fontSize: 12,
      fontWeight: '900',
      textAlign: 'center',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      marginBottom: 6,
      width: '14.2857%',
    },
    dayCellMuted: {
      opacity: 0.38,
    },
    dayCellToday: {
      borderColor: colors.blue,
    },
    dayCellSelected: {
      backgroundColor: colors.blueStrong,
      borderColor: colors.blueStrong,
    },
    dayNumber: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
    },
    dayNumberMuted: {
      color: colors.muted,
    },
    dayNumberSelected: {
      color: '#FFFFFF',
    },
    shiftDots: {
      flexDirection: 'row',
      gap: 3,
      height: 7,
      marginTop: 4,
    },
    shiftDot: {
      borderRadius: 3,
      height: 6,
      width: 6,
    },
    loadingText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 8,
      textAlign: 'center',
    },
    weekStrip: {
      flexDirection: 'row',
      gap: 6,
    },
    weekDayCard: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 84,
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    weekDayLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '900',
      marginBottom: 4,
    },
    weekDayNumber: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '900',
      marginBottom: 4,
    },
    weekShiftCount: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      textAlign: 'center',
    },
    dayFocusText: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 22,
      textAlign: 'center',
    },
    yearGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    yearMonthCard: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      minHeight: 82,
      padding: 10,
      width: '31.6%',
    },
    yearMonthName: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
      marginBottom: 8,
      textTransform: 'capitalize',
    },
    yearMonthStats: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 4,
    },
    yearMonthHours: {
      color: colors.blue,
      fontSize: 13,
      fontWeight: '900',
    },
    dayPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: 16,
    },
    panelEyebrow: {
      color: colors.blue,
      fontSize: 12,
      fontWeight: '900',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    selectedDateTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
      marginBottom: 14,
      textTransform: 'capitalize',
    },
    shiftList: {
      gap: 10,
      marginBottom: 16,
    },
    shiftRow: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
    },
    shiftColorBar: {
      borderRadius: 8,
      height: 48,
      marginRight: 10,
      width: 6,
    },
    shiftInfo: {
      flex: 1,
      paddingRight: 10,
    },
    shiftTime: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
      marginBottom: 4,
    },
    shiftMeta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    shiftNotes: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 6,
    },
    rowActions: {
      flexDirection: 'row',
      gap: 6,
    },
    smallIconButton: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    emptyText: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 16,
    },
    actionSplit: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
      marginBottom: 14,
    },
    actionButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 12,
    },
    actionButtonActive: {
      backgroundColor: colors.blueStrong,
      borderColor: colors.blueStrong,
    },
    actionButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
    },
    actionButtonTextActive: {
      color: '#FFFFFF',
    },
    formPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 14,
      padding: 16,
    },
    formSectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 8,
    },
    helperText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.input,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    timeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    timeField: {
      flex: 1,
    },
    notesInput: {
      minHeight: 78,
      textAlignVertical: 'top',
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    colorSwatch: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 2,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    colorSwatchActive: {
      borderColor: colors.text,
    },
    templateList: {
      gap: 10,
    },
    templateCard: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      padding: 12,
    },
    templateColor: {
      borderRadius: 8,
      height: 38,
      marginRight: 10,
      width: 38,
    },
    templateName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
      marginBottom: 4,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.blueStrong,
      borderRadius: 8,
      justifyContent: 'center',
      marginTop: 8,
      minHeight: 50,
      paddingVertical: 14,
    },
    disabledButton: {
      opacity: 0.65,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },
    placeholderPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: 18,
    },
    placeholderTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
      marginBottom: 10,
    },
    placeholderText: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: 24,
    },
    bottomNav: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    bottomNavItem: {
      alignItems: 'center',
      borderRadius: 8,
      flex: 1,
      justifyContent: 'center',
      minHeight: 58,
      paddingHorizontal: 2,
      paddingVertical: 6,
    },
    bottomNavCenter: {
      marginHorizontal: 2,
    },
    bottomNavItemActive: {
      backgroundColor: colors.blueStrong,
    },
    bottomNavLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '900',
      marginTop: 4,
      textAlign: 'center',
    },
    bottomNavLabelActive: {
      color: '#FFFFFF',
    },
    configPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      margin: 24,
      padding: 18,
    },
    configText: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 14,
    },
    configCode: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: 6,
      color: colors.text,
      fontSize: 13,
      marginTop: 8,
      padding: 10,
    },
  })
