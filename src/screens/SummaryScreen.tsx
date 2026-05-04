import { Pressable, Text, View } from 'react-native'
import { SummaryRow } from '../components/SummaryRow'
import type { AppStyles } from '../theme'
import type { WorkRules } from '../types'
import type { PayrollSummary } from '../utils/payroll'
import { formatCurrency } from '../utils/payroll'

type SummaryScreenProps = {
  changeMonth: (monthOffset: number) => void
  monthTitle: string
  payrollSummary: PayrollSummary
  styles: AppStyles
  workRules: WorkRules
}

export function SummaryScreen({ changeMonth, monthTitle, payrollSummary, styles, workRules }: SummaryScreenProps) {
  return (
    <>
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
        <Text style={styles.helperText}>Resumen calculado con los turnos del mes y los ajustes de tu perfil.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{payrollSummary.totalHours.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Trabajadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{payrollSummary.complementaryHours.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Extras</Text>
        </View>
      </View>

      <View style={styles.dayPanel}>
        <Text style={styles.panelEyebrow}>Horas</Text>
        <SummaryRow styles={styles} label="Horas de contrato" value={`${payrollSummary.contractHours.toFixed(1)}h`} />
        <SummaryRow styles={styles} label="Horas totales" value={`${payrollSummary.totalHours.toFixed(1)}h`} />
        <SummaryRow styles={styles} label="Horas complementarias/extras" value={`${payrollSummary.complementaryHours.toFixed(1)}h`} />
        <SummaryRow styles={styles} label="Horas nocturnas" value={`${payrollSummary.nightHours.toFixed(1)}h`} detail={`${payrollSummary.nightRangeRows.length} tramo(s)`} />
        <SummaryRow
          styles={styles}
          label="Horas festivas"
          value={`${payrollSummary.holidayHours.toFixed(1)}h`}
          detail={`${payrollSummary.holidayShiftCount} turno${payrollSummary.holidayShiftCount === 1 ? '' : 's'} en festivo`}
        />
      </View>

      <View style={styles.dayPanel}>
        <Text style={styles.panelEyebrow}>Resumen salarial</Text>
        <SummaryRow styles={styles} label="Salario bruto base" value={formatCurrency(payrollSummary.baseSalary)} />
        <SummaryRow
          styles={styles}
          label="Horas complementarias"
          value={formatCurrency(payrollSummary.complementaryPay)}
          detail={`${payrollSummary.complementaryHours.toFixed(1)}h x ${formatCurrency(Number(workRules.complementary_hour_rate || 0))}`}
        />
        <SummaryRow
          styles={styles}
          label="Nocturnidad"
          value={formatCurrency(payrollSummary.nightPay)}
          detail={
            payrollSummary.nightRangeRows.length === 1
              ? `${payrollSummary.nightHours.toFixed(1)}h x ${formatCurrency(Number(payrollSummary.nightRangeRows[0]?.hour_rate || 0))}`
              : `${payrollSummary.nightRangeRows.length} tramos configurados`
          }
        />
        {payrollSummary.nightRangeRows.length > 1
          ? payrollSummary.nightRangeRows.map((range) => (
              <SummaryRow
                key={range.id}
                styles={styles}
                label={`${range.start_time} - ${range.end_time}`}
                value={formatCurrency(range.pay)}
                detail={`${range.hours.toFixed(1)}h x ${formatCurrency(Number(range.hour_rate || 0))}`}
              />
            ))
          : null}
        <SummaryRow
          styles={styles}
          label="Festivos"
          value={formatCurrency(payrollSummary.holidayPay)}
          detail={
            workRules.holiday_pay_mode === 'shift'
              ? `${payrollSummary.holidayShiftCount} turnos x ${formatCurrency(Number(workRules.holiday_shift_rate || 0))}`
              : `${payrollSummary.holidayHours.toFixed(1)}h x ${formatCurrency(Number(workRules.holiday_hour_rate || 0))}`
          }
        />
        <View style={styles.summaryDivider} />
        <SummaryRow styles={styles} label="Total bruto estimado" value={formatCurrency(payrollSummary.grossSalary)} />
      </View>

      <View style={styles.dayPanel}>
        <Text style={styles.panelEyebrow}>Deducciones</Text>
        {payrollSummary.deductionRows.length === 0 ? (
          <Text style={styles.emptyText}>No hay deducciones configuradas.</Text>
        ) : (
          payrollSummary.deductionRows.map((deduction) => (
            <SummaryRow
              key={deduction.id}
              styles={styles}
              label={deduction.name}
              value={`-${formatCurrency(deduction.amount)}`}
              detail={`${Number(deduction.percentage || 0).toFixed(2)}% del bruto`}
            />
          ))
        )}
        <View style={styles.summaryDivider} />
        <SummaryRow styles={styles} label="Total deducciones" value={`-${formatCurrency(payrollSummary.totalDeductions)}`} />
        <SummaryRow styles={styles} label="Neto estimado" value={formatCurrency(payrollSummary.estimatedNetSalary)} />
      </View>
    </>
  )
}
