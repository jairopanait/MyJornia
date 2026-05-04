import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { Pencil, Plus, Trash2 } from 'lucide-react-native'
import { calendarViews, monthNames } from '../constants'
import { ColorPicker } from '../components/ColorPicker'
import { ShiftIcon, ShiftIconPicker } from '../components/ShiftIconPicker'
import type { AppColors, AppStyles } from '../theme'
import type { AppTab, CalendarViewMode, SaveShiftPayload, ShiftActionMode, ShiftIconId, ShiftType, WorkShift } from '../types'
import { addDays, buildCalendarDays, buildWeekDays, dateFromKey, formatSelectedDate, formatTime, normalizeTime, padNumber } from '../utils/dates'
import { getShiftColor, getShiftHours, getShiftIconId, getShiftTitle } from '../utils/payroll'

type CalendarScreenProps = {
  breakMinutes: string
  calendarLoading: boolean
  calendarView: CalendarViewMode
  changeMonth: (monthOffset: number) => void
  colors: AppColors
  currentMonth: Date
  editingShiftId: string | null
  endTime: string
  handleDeleteShift: (shiftId: string) => void
  holidayDates: string[]
  saveShiftInstance: (data: SaveShiftPayload) => void
  savingShift: boolean
  selectCalendarDate: (dateKey: string) => void
  selectedDate: string
  selectedDateShifts: WorkShift[]
  setActiveTab: (tab: AppTab) => void
  setBreakMinutes: (value: string) => void
  setCalendarView: (view: CalendarViewMode) => void
  setCurrentMonth: (date: Date) => void
  setEndTime: (value: string) => void
  setSelectedDate: (dateKey: string) => void
  setShiftActionMode: (mode: ShiftActionMode) => void
  setShiftColor: (value: string) => void
  setShiftIcon: (value: ShiftIconId) => void
  setShiftIsTimeOff: (value: boolean) => void
  setShiftNotes: (value: string) => void
  setShiftTitle: (value: string) => void
  setStartTime: (value: string) => void
  shiftActionMode: ShiftActionMode
  shiftColor: string
  shiftIcon: ShiftIconId
  shiftIsTimeOff: boolean
  shiftNotes: string
  shiftTitle: string
  shiftTypes: ShiftType[]
  shifts: WorkShift[]
  startAddShift: () => void
  startCreateShift: () => void
  startEditShift: (shift: WorkShift) => void
  startTime: string
  styles: AppStyles
  visibleHours: number
}

export function CalendarScreen({
  breakMinutes,
  calendarLoading,
  calendarView,
  changeMonth,
  colors,
  currentMonth,
  editingShiftId,
  endTime,
  handleDeleteShift,
  holidayDates,
  saveShiftInstance,
  savingShift,
  selectCalendarDate,
  selectedDate,
  selectedDateShifts,
  setActiveTab,
  setBreakMinutes,
  setCalendarView,
  setCurrentMonth,
  setEndTime,
  setSelectedDate,
  setShiftColor,
  setShiftIcon,
  setShiftIsTimeOff,
  setShiftNotes,
  setShiftTitle,
  setStartTime,
  shiftActionMode,
  shiftColor,
  shiftIcon,
  shiftIsTimeOff,
  shiftNotes,
  shiftTitle,
  shiftTypes,
  shifts,
  startAddShift,
  startCreateShift,
  startEditShift,
  startTime,
  styles,
  visibleHours,
}: CalendarScreenProps) {
  const monthTitle = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
  const calendarDays = buildCalendarDays(currentMonth, shifts)
  const weekDays = buildWeekDays(selectedDate, shifts)

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
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((weekday) => (
            <Text key={weekday} style={styles.weekdayText}>
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            const isSelected = day.dateKey === selectedDate
            const isHoliday = holidayDates.includes(day.dateKey)

            return (
              <Pressable
                key={day.dateKey}
                style={[
                  styles.dayCell,
                  !day.inMonth && styles.dayCellMuted,
                  day.isToday && styles.dayCellToday,
                  isHoliday && styles.dayCellHoliday,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => selectCalendarDate(day.dateKey)}
              >
                <Text style={[styles.dayNumber, !day.inMonth && styles.dayNumberMuted, isSelected && styles.dayNumberSelected]}>
                  {day.dayNumber}
                </Text>
                <View style={styles.shiftDots}>
                  {isHoliday ? <View style={[styles.holidayDot, isSelected && { backgroundColor: '#FFFFFF' }]} /> : null}
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
            const isHoliday = holidayDates.includes(day.dateKey)

            return (
              <Pressable
                key={day.dateKey}
                style={[styles.weekDayCard, day.isToday && styles.dayCellToday, isHoliday && styles.dayCellHoliday, isSelected && styles.dayCellSelected]}
                onPress={() => selectCalendarDate(day.dateKey)}
              >
                <Text style={[styles.weekDayLabel, isSelected && styles.dayNumberSelected]}>{day.weekday}</Text>
                <Text style={[styles.weekDayNumber, isSelected && styles.dayNumberSelected]}>{day.dayNumber}</Text>
                <Text style={[styles.weekShiftCount, isSelected && styles.dayNumberSelected]}>{isHoliday ? 'Festivo' : `${day.shifts.length} turnos`}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  function renderDayCalendar() {
    const isHoliday = holidayDates.includes(selectedDate)

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
          {isHoliday
            ? 'Festivo según tus ajustes'
            : selectedDateShifts.length > 0
              ? `${selectedDateShifts.length} turno${selectedDateShifts.length === 1 ? '' : 's'} para este día`
              : 'Día libre o sin turnos guardados'}
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
      const holidayCount = holidayDates.filter((dateKey) => {
        const holidayDate = dateFromKey(dateKey)
        return holidayDate.getFullYear() === year && holidayDate.getMonth() === index
      }).length

      return {
        index,
        name,
        count: monthShifts.length,
        holidayCount,
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
              <Text style={styles.yearMonthStats}>{month.holidayCount} festivos</Text>
              <Text style={styles.yearMonthHours}>{month.hours.toFixed(0)}h</Text>
            </Pressable>
          ))}
        </View>
      </View>
    )
  }

  function renderShiftCards() {
    if (selectedDateShifts.length === 0) {
      return <Text style={styles.emptyText}>No hay turnos para este día.</Text>
    }

    return (
      <View style={styles.shiftList}>
        {selectedDateShifts.map((shift) => (
          <View key={shift.id} style={styles.shiftRow}>
            <View style={[styles.shiftColorBar, { backgroundColor: getShiftColor(shift) }]} />
            <View style={styles.shiftIconBadge}>
              <ShiftIcon color={colors.blue} id={getShiftIconId(shift)} size={18} />
            </View>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftTime}>{getShiftTitle(shift)}</Text>
              <Text style={styles.shiftMeta}>
                {shift.is_time_off ? 'Sin horas' : `${formatTime(shift.start_at)} - ${formatTime(shift.end_at)} · ${getShiftHours(shift).toFixed(1)}h netas`}
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
        <Text style={styles.helperText}>Este turno solo se guarda en este día. No se añade a la lista de turnos personalizados.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre del turno</Text>
          <TextInput value={shiftTitle} onChangeText={setShiftTitle} style={styles.input} placeholder="Ej. Noche extra" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Icono</Text>
          <ShiftIconPicker colors={colors} value={shiftIcon} onChange={setShiftIcon} styles={styles} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Color</Text>
          <ColorPicker value={shiftColor} onChange={setShiftColor} styles={styles} />
        </View>

        <View style={styles.actionSplit}>
          <Pressable style={[styles.actionButton, !shiftIsTimeOff && styles.actionButtonActive]} onPress={() => setShiftIsTimeOff(false)}>
            <Text style={[styles.actionButtonText, !shiftIsTimeOff && styles.actionButtonTextActive]}>Con horas</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, shiftIsTimeOff && styles.actionButtonActive]} onPress={() => setShiftIsTimeOff(true)}>
            <Text style={[styles.actionButtonText, shiftIsTimeOff && styles.actionButtonTextActive]}>Sin horas</Text>
          </Pressable>
        </View>

        {!shiftIsTimeOff ? (
          <>
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
          </>
        ) : null}

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
              icon: shiftIcon,
              isTimeOff: shiftIsTimeOff,
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
        <Text style={styles.formSectionTitle}>Añadir turno guardado</Text>

        {shiftTypes.length === 0 ? (
          <View>
            <Text style={styles.emptyText}>Todavía no tienes turnos personalizados.</Text>
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
                    icon: template.icon || 'briefcase',
                    isTimeOff: Boolean(template.is_time_off),
                    start: normalizeTime(template.default_start_time) || '00:00',
                    end: normalizeTime(template.default_end_time) || '00:00',
                    breakValue: '0',
                    notes: '',
                    shiftTypeId: template.id,
                  })
                }
              >
                <View style={[styles.templateColor, { backgroundColor: template.color, alignItems: 'center', justifyContent: 'center' }]}>
                  <ShiftIcon color="#FFFFFF" id={template.icon} size={18} />
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.shiftMeta}>
                    {template.is_time_off ? 'Sin horas' : `${normalizeTime(template.default_start_time) || '--:--'} - ${normalizeTime(template.default_end_time) || '--:--'}`}
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

      {calendarView !== 'year' ? (
        <View style={styles.dayPanel}>
          <Text style={styles.panelEyebrow}>Día seleccionado</Text>
          <Text style={styles.selectedDateTitle}>{formatSelectedDate(selectedDate)}</Text>
          {holidayDates.includes(selectedDate) ? <Text style={styles.helperText}>Festivo marcado para el cálculo del resumen.</Text> : null}

          {renderShiftCards()}

          <View style={styles.actionSplit}>
            <Pressable style={[styles.actionButton, shiftActionMode === 'create' && styles.actionButtonActive]} onPress={startCreateShift}>
              <Text style={[styles.actionButtonText, shiftActionMode === 'create' && styles.actionButtonTextActive]}>Crear turno</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, shiftActionMode === 'add' && styles.actionButtonActive]} onPress={startAddShift}>
              <Text style={[styles.actionButtonText, shiftActionMode === 'add' && styles.actionButtonTextActive]}>Añadir turno</Text>
            </Pressable>
          </View>

          {shiftActionMode === 'create' ? renderCreateShiftForm() : null}
          {shiftActionMode === 'add' ? renderAddShiftFromTemplate() : null}
        </View>
      ) : null}
    </>
  )
}
