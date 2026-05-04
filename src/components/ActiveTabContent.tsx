import type { Dispatch, SetStateAction } from 'react'
import { CalendarScreen } from '../screens/CalendarScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ShiftTypesScreen } from '../screens/ShiftTypesScreen'
import { SummaryScreen } from '../screens/SummaryScreen'
import type { AppColors, AppStyles } from '../theme'
import type { MfaController } from '../hooks/useMfaController'
import type { SecurityController } from '../hooks/useSecurityController'
import type { WorkdayController } from '../hooks/useWorkdayController'
import type { ThemeMode } from '../types'

type ActiveTabContentProps = {
  colors: AppColors
  controller: WorkdayController
  handleSignOut: () => void
  isDark: boolean
  mfa: MfaController
  security: SecurityController
  sessionEmail?: string
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>
  styles: AppStyles
}

export function ActiveTabContent({
  colors,
  controller,
  handleSignOut,
  isDark,
  mfa,
  security,
  sessionEmail,
  setThemeMode,
  styles,
}: ActiveTabContentProps) {
  if (controller.activeTab === 'calendar') {
    return (
      <CalendarScreen
        breakMinutes={controller.breakMinutes}
        calendarLoading={controller.calendarLoading}
        calendarView={controller.calendarView}
        changeMonth={controller.changeMonth}
        colors={colors}
        currentMonth={controller.currentMonth}
        editingShiftId={controller.editingShiftId}
        endTime={controller.endTime}
        handleDeleteShift={controller.handleDeleteShift}
        holidayDates={controller.holidayDates}
        saveShiftInstance={controller.saveShiftInstance}
        savingShift={controller.savingShift}
        selectCalendarDate={controller.selectCalendarDate}
        selectedDate={controller.selectedDate}
        selectedDateShifts={controller.selectedDateShifts}
        setActiveTab={controller.setActiveTab}
        setBreakMinutes={controller.setBreakMinutes}
        setCalendarView={controller.setCalendarView}
        setCurrentMonth={controller.setCurrentMonth}
        setEndTime={controller.setEndTime}
        setSelectedDate={controller.setSelectedDate}
        setShiftActionMode={controller.setShiftActionMode}
        setShiftColor={controller.setShiftColor}
        setShiftIcon={controller.setShiftIcon}
        setShiftIsTimeOff={controller.setShiftIsTimeOff}
        setShiftNotes={controller.setShiftNotes}
        setShiftTitle={controller.setShiftTitle}
        setStartTime={controller.setStartTime}
        shiftActionMode={controller.shiftActionMode}
        shiftColor={controller.shiftColor}
        shiftIcon={controller.shiftIcon}
        shiftIsTimeOff={controller.shiftIsTimeOff}
        shiftNotes={controller.shiftNotes}
        shiftTitle={controller.shiftTitle}
        shiftTypes={controller.shiftTypes}
        shifts={controller.shifts}
        startAddShift={controller.startAddShift}
        startCreateShift={controller.startCreateShift}
        startEditShift={controller.startEditShift}
        startTime={controller.startTime}
        styles={styles}
        visibleHours={controller.visibleHours}
      />
    )
  }

  if (controller.activeTab === 'shiftTypes') {
    return (
      <ShiftTypesScreen
        colors={colors}
        editingTemplateId={controller.editingTemplateId}
        handleDeleteTemplate={controller.handleDeleteTemplate}
        handleSaveTemplate={controller.handleSaveTemplate}
        savingTemplate={controller.savingTemplate}
        setTemplateColor={controller.setTemplateColor}
        setTemplateEnd={controller.setTemplateEnd}
        setTemplateIcon={controller.setTemplateIcon}
        setTemplateIsTimeOff={controller.setTemplateIsTimeOff}
        setTemplateName={controller.setTemplateName}
        setTemplateStart={controller.setTemplateStart}
        shiftTypes={controller.shiftTypes}
        startEditTemplate={controller.startEditTemplate}
        styles={styles}
        templateColor={controller.templateColor}
        templateEnd={controller.templateEnd}
        templateIcon={controller.templateIcon}
        templateIsTimeOff={controller.templateIsTimeOff}
        templateName={controller.templateName}
        templateStart={controller.templateStart}
      />
    )
  }

  if (controller.activeTab === 'summary') {
    return (
      <SummaryScreen
        changeMonth={controller.changeMonth}
        monthTitle={controller.monthTitle}
        payrollSummary={controller.payrollSummary}
        styles={styles}
        workRules={controller.workRules}
      />
    )
  }

  if (controller.activeTab === 'settings') {
    return (
      <SettingsScreen
        additionAmount={controller.additionAmount}
        additionMode={controller.additionMode}
        additionName={controller.additionName}
        additionShiftTypeIds={controller.additionShiftTypeIds}
        colors={colors}
        addLocalHoliday={controller.addLocalHoliday}
        addNightRange={controller.addNightRange}
        deductionName={controller.deductionName}
        deductionPercentage={controller.deductionPercentage}
        deductions={controller.deductions}
        deleteAddition={controller.deleteAddition}
        deleteDeduction={controller.deleteDeduction}
        deleteLocalHoliday={controller.deleteLocalHoliday}
        editingDeductionId={controller.editingDeductionId}
        editingAdditionId={controller.editingAdditionId}
        localHolidayDateInput={controller.localHolidayDateInput}
        localHolidays={controller.localHolidays}
        nightPayRanges={controller.nightPayRanges}
        payrollAdditions={controller.payrollAdditions}
        removeNightRange={controller.removeNightRange}
        saveAddition={controller.saveAddition}
        saveDeduction={controller.saveDeduction}
        saveWorkRules={controller.saveWorkRules}
        savingDeduction={controller.savingDeduction}
        savingAddition={controller.savingAddition}
        savingWorkRules={controller.savingWorkRules}
        setAdditionAmount={controller.setAdditionAmount}
        setAdditionMode={controller.setAdditionMode}
        setAdditionName={controller.setAdditionName}
        setAdditionShiftTypeIds={controller.setAdditionShiftTypeIds}
        setDeductionName={controller.setDeductionName}
        setDeductionPercentage={controller.setDeductionPercentage}
        setLocalHolidayDateInput={controller.setLocalHolidayDateInput}
        setWorkRules={controller.setWorkRules}
        startEditAddition={controller.startEditAddition}
        startEditDeduction={controller.startEditDeduction}
        styles={styles}
        shiftTypes={controller.shiftTypes}
        toggleAdditionShiftType={controller.toggleAdditionShiftType}
        updateNightRange={controller.updateNightRange}
        workRules={controller.workRules}
      />
    )
  }

  return (
    <ProfileScreen
      adminLoading={controller.adminLoading}
      adminStats={controller.adminStats}
      greetingName={controller.greetingName}
      isAdmin={controller.isAdmin}
      handleSignOut={handleSignOut}
      isDark={isDark}
      loadAdminStats={controller.loadAdminStats}
      mfa={mfa}
      security={security}
      sessionEmail={sessionEmail}
      setThemeMode={setThemeMode}
      styles={styles}
    />
  )
}
