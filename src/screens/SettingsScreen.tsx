import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { Pencil, Trash2 } from 'lucide-react-native'
import type { Dispatch, SetStateAction } from 'react'
import { DecimalInput } from '../components/DecimalInput'
import { SelectField } from '../components/SelectField'
import { autonomousCommunities } from '../data/holidays'
import type { AppColors, AppStyles } from '../theme'
import type { LocalHoliday, NightPayRange, PayrollAddition, PayrollAdditionMode, PayrollDeduction, WorkRules } from '../types'
import { normalizeTime } from '../utils/dates'
import { parseNumber } from '../utils/payroll'

type SettingsScreenProps = {
  additionAmount: string
  additionMode: PayrollAdditionMode
  additionName: string
  addLocalHoliday: () => void
  addNightRange: () => void
  colors: AppColors
  deductionName: string
  deductionPercentage: string
  deductions: PayrollDeduction[]
  deleteAddition: (additionId: string) => void
  deleteDeduction: (deductionId: string) => void
  deleteLocalHoliday: (holidayId: string) => void
  editingDeductionId: string | null
  editingAdditionId: string | null
  localHolidayDateInput: string
  localHolidays: LocalHoliday[]
  nightPayRanges: NightPayRange[]
  payrollAdditions: PayrollAddition[]
  removeNightRange: (rangeId: string) => void
  saveAddition: () => void
  saveDeduction: () => void
  saveWorkRules: () => void
  savingDeduction: boolean
  savingAddition: boolean
  savingWorkRules: boolean
  setAdditionAmount: (value: string) => void
  setAdditionMode: (value: PayrollAdditionMode) => void
  setAdditionName: (value: string) => void
  setDeductionName: (value: string) => void
  setDeductionPercentage: (value: string) => void
  setLocalHolidayDateInput: (value: string) => void
  setWorkRules: Dispatch<SetStateAction<WorkRules>>
  startEditAddition: (addition: PayrollAddition) => void
  startEditDeduction: (deduction: PayrollDeduction) => void
  styles: AppStyles
  updateNightRange: (rangeId: string, patch: Partial<Pick<NightPayRange, 'end_time' | 'hour_rate' | 'start_time'>>) => void
  workRules: WorkRules
}

export function SettingsScreen({
  additionAmount,
  additionMode,
  additionName,
  addLocalHoliday,
  addNightRange,
  colors,
  deductionName,
  deductionPercentage,
  deductions,
  deleteAddition,
  deleteDeduction,
  deleteLocalHoliday,
  editingDeductionId,
  editingAdditionId,
  localHolidayDateInput,
  localHolidays,
  nightPayRanges,
  payrollAdditions,
  removeNightRange,
  saveAddition,
  saveDeduction,
  saveWorkRules,
  savingDeduction,
  savingAddition,
  savingWorkRules,
  setAdditionAmount,
  setAdditionMode,
  setAdditionName,
  setDeductionName,
  setDeductionPercentage,
  setLocalHolidayDateInput,
  setWorkRules,
  startEditAddition,
  startEditDeduction,
  styles,
  updateNightRange,
  workRules,
}: SettingsScreenProps) {
  const additionModeOptions = [
    { label: 'Fijo mensual', value: 'fixed' },
    { label: 'Por turno trabajado', value: 'per_shift' },
    { label: 'Por hora trabajada', value: 'per_hour' },
  ]

  function getAdditionModeLabel(mode: PayrollAdditionMode) {
    return additionModeOptions.find((option) => option.value === mode)?.label ?? 'Concepto'
  }

  return (
    <>
      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>Contrato</Text>
        <Text style={styles.helperText}>Estos datos alimentan el resumen mensual.</Text>

        <DecimalInput
          label="Horas de contrato al mes"
          value={Number(workRules.contract_hours || 0)}
          onValueChange={(value) => setWorkRules((rules) => ({ ...rules, contract_hours: value, monthly_extra_hours: value }))}
          styles={styles}
        />
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>Nocturnidad</Text>
        <Text style={styles.helperText}>Puedes dividir la noche en varios tramos, por ejemplo 22:00-00:00 y 00:00-06:00.</Text>

        {nightPayRanges.length === 0 ? <Text style={styles.emptyText}>Añade tu primer tramo nocturno.</Text> : null}

        <View style={styles.templateList}>
          {nightPayRanges.map((range) => (
            <View key={range.id} style={styles.templateCard}>
              <View style={styles.shiftInfo}>
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.label}>Desde</Text>
                    <TextInput
                      value={normalizeTime(range.start_time)}
                      onChangeText={(text) => updateNightRange(range.id, { start_time: text })}
                      style={styles.input}
                      placeholder="22:00"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.label}>Hasta</Text>
                    <TextInput
                      value={normalizeTime(range.end_time)}
                      onChangeText={(text) => updateNightRange(range.id, { end_time: text })}
                      style={styles.input}
                      placeholder="06:00"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
                <DecimalInput
                  label="Precio por hora nocturna"
                  value={Number(range.hour_rate || 0)}
                  onValueChange={(value) => updateNightRange(range.id, { hour_rate: value })}
                  styles={styles}
                />
              </View>
              <Pressable style={styles.smallIconButton} onPress={() => removeNightRange(range.id)}>
                <Trash2 size={16} color={colors.blue} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable style={styles.secondaryButton} onPress={addNightRange}>
          <Text style={styles.secondaryButtonText}>Añadir tramo</Text>
        </Pressable>
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>Festivos</Text>
        <Text style={styles.helperText}>La comunidad carga festivos nacionales y autonómicos de 2026. Los locales se añaden a mano.</Text>

        <SelectField
          colors={colors}
          label="Comunidad autónoma"
          value={workRules.autonomous_community ?? ''}
          onChange={(value) => setWorkRules((rules) => ({ ...rules, autonomous_community: value }))}
          options={autonomousCommunities.map((community) => ({ label: community.label, value: community.id }))}
          styles={styles}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Festivo local</Text>
          <TextInput
            value={localHolidayDateInput}
            onChangeText={setLocalHolidayDateInput}
            style={styles.input}
            placeholder="2026-05-15"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <Pressable style={styles.secondaryButton} onPress={addLocalHoliday}>
          <Text style={styles.secondaryButtonText}>Añadir festivo local</Text>
        </Pressable>

        <View style={styles.templateList}>
          {localHolidays.map((holiday) => (
            <View key={holiday.id} style={styles.templateCard}>
              <View style={styles.shiftInfo}>
                <Text style={styles.templateName}>{holiday.holiday_date}</Text>
                <Text style={styles.shiftMeta}>Festivo local/manual</Text>
              </View>
              <Pressable style={styles.smallIconButton} onPress={() => deleteLocalHoliday(holiday.id)}>
                <Trash2 size={16} color={colors.blue} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>Salario y pluses</Text>
        <DecimalInput
          label="Salario bruto base mensual"
          value={Number(workRules.base_salary || 0)}
          onValueChange={(value) => setWorkRules((rules) => ({ ...rules, base_salary: value }))}
          styles={styles}
        />
        <DecimalInput
          label="Precio hora complementaria/extra"
          value={Number(workRules.complementary_hour_rate || 0)}
          onValueChange={(value) => setWorkRules((rules) => ({ ...rules, complementary_hour_rate: value }))}
          styles={styles}
        />

        <Text style={styles.label}>Festivos</Text>
        <View style={styles.actionSplit}>
          <Pressable
            style={[styles.actionButton, workRules.holiday_pay_mode === 'hour' && styles.actionButtonActive]}
            onPress={() => setWorkRules((rules) => ({ ...rules, holiday_pay_mode: 'hour' }))}
          >
            <Text style={[styles.actionButtonText, workRules.holiday_pay_mode === 'hour' && styles.actionButtonTextActive]}>Por hora</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, workRules.holiday_pay_mode === 'shift' && styles.actionButtonActive]}
            onPress={() => setWorkRules((rules) => ({ ...rules, holiday_pay_mode: 'shift' }))}
          >
            <Text style={[styles.actionButtonText, workRules.holiday_pay_mode === 'shift' && styles.actionButtonTextActive]}>Por turno</Text>
          </Pressable>
        </View>

        <DecimalInput
          label="Plus por hora festiva"
          value={Number(workRules.holiday_hour_rate || 0)}
          onValueChange={(value) => setWorkRules((rules) => ({ ...rules, holiday_hour_rate: value }))}
          styles={styles}
        />
        <DecimalInput
          label="Plus por turno festivo"
          value={Number(workRules.holiday_shift_rate || 0)}
          onValueChange={(value) => setWorkRules((rules) => ({ ...rules, holiday_shift_rate: value }))}
          styles={styles}
        />

        <Pressable style={[styles.primaryButton, savingWorkRules && styles.disabledButton]} onPress={saveWorkRules} disabled={savingWorkRules}>
          {savingWorkRules ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Guardar ajustes</Text>}
        </Pressable>
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>Pagas extra</Text>
        <Text style={styles.helperText}>Crea conceptos positivos de nómina, como limpieza de ropa, transporte o dietas.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput value={additionName} onChangeText={setAdditionName} style={styles.input} placeholder="Ej. Limpieza de ropa" placeholderTextColor="#94A3B8" />
        </View>

        <DecimalInput
          label="Cantidad"
          value={parseNumber(additionAmount)}
          onValueChange={(value) => setAdditionAmount(String(value))}
          styles={styles}
        />

        <SelectField
          colors={colors}
          label="Cómo se calcula"
          value={additionMode}
          onChange={(value) => setAdditionMode(value as PayrollAdditionMode)}
          options={additionModeOptions}
          styles={styles}
        />

        <Pressable style={[styles.primaryButton, savingAddition && styles.disabledButton]} onPress={saveAddition} disabled={savingAddition}>
          {savingAddition ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingAdditionId ? 'Guardar concepto' : 'Añadir concepto'}</Text>}
        </Pressable>

        <View style={styles.templateList}>
          {payrollAdditions.map((addition) => (
            <View key={addition.id} style={styles.templateCard}>
              <View style={styles.shiftInfo}>
                <Text style={styles.templateName}>{addition.name}</Text>
                <Text style={styles.shiftMeta}>
                  {Number(addition.amount || 0).toFixed(2)} € · {getAdditionModeLabel(addition.mode)}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable style={styles.smallIconButton} onPress={() => startEditAddition(addition)}>
                  <Pencil size={16} color={colors.blue} />
                </Pressable>
                <Pressable style={styles.smallIconButton} onPress={() => deleteAddition(addition.id)}>
                  <Trash2 size={16} color={colors.blue} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.dayPanel}>
        <Text style={styles.panelEyebrow}>Deducciones</Text>
        <Text style={styles.helperText}>Añade porcentajes como IRPF, contingencias u otras retenciones. Se calculan sobre el bruto estimado.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput value={deductionName} onChangeText={setDeductionName} style={styles.input} placeholder="Ej. IRPF" placeholderTextColor="#94A3B8" />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Porcentaje</Text>
          <TextInput
            value={deductionPercentage}
            onChangeText={setDeductionPercentage}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <Pressable style={[styles.primaryButton, savingDeduction && styles.disabledButton]} onPress={saveDeduction} disabled={savingDeduction}>
          {savingDeduction ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingDeductionId ? 'Guardar deducción' : 'Añadir deducción'}</Text>}
        </Pressable>

        <View style={styles.templateList}>
          {deductions.map((deduction) => (
            <View key={deduction.id} style={styles.templateCard}>
              <View style={styles.shiftInfo}>
                <Text style={styles.templateName}>{deduction.name}</Text>
                <Text style={styles.shiftMeta}>{Number(deduction.percentage || 0).toFixed(2)}%</Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable style={styles.smallIconButton} onPress={() => startEditDeduction(deduction)}>
                  <Pencil size={16} color={colors.blue} />
                </Pressable>
                <Pressable style={styles.smallIconButton} onPress={() => deleteDeduction(deduction.id)}>
                  <Trash2 size={16} color={colors.blue} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  )
}
