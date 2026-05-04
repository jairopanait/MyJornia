import { Pressable, Text, View } from 'react-native'
import { SummaryRow } from '../components/SummaryRow'
import type { AppStyles } from '../theme'
import type { WorkRules } from '../types'
import { normalizeTime } from '../utils/dates'
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
  function getAdditionDetail(mode: string, quantity: number, amount: number) {
    if (mode === 'per_shift') {
      return `${quantity.toFixed(0)} turnos x ${formatCurrency(amount)}`
    }

    if (mode === 'per_hour') {
      return `${quantity.toFixed(1)}h x ${formatCurrency(amount)}`
    }

    return 'Fijo mensual'
  }

  return (
    <>
      <View style={styles.monthBar}>
        <Pressable style={styles.iconButton} onPress={() => changeMonth(-1)}>
          <Text style={styles.iconButtonText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
        <Pressable style={styles.iconButton} onPress={() => changeMonth(1)}>
          <Text style={styles.iconButtonText}>{'>'}</Text>
        </Pressable>
      </View>

      <View style={styles.groupedPanel}>
        <Text style={styles.groupedPanelTitle}>Balance del mes</Text>
        <SummaryRow styles={styles} label="Turnos trabajados" value={String(payrollSummary.workedShiftCount)} />
        <SummaryRow styles={styles} label="Turnos en festivo" value={String(payrollSummary.holidayShiftCount)} />
        <SummaryRow styles={styles} label="Extras" value={`${payrollSummary.complementaryHours.toFixed(1)}h`} />
        <SummaryRow styles={styles} label="Nocturnas" value={`${payrollSummary.nightHours.toFixed(1)}h`} />
      </View>

      <View style={styles.groupedPanel}>
        <Text style={styles.groupedPanelTitle}>Horas reales</Text>
        <SummaryRow styles={styles} label="Contrato" value={`${payrollSummary.contractHours.toFixed(2).replace('.', ',')} h`} />
        <SummaryRow styles={styles} label="Trabajadas" value={`${payrollSummary.totalHours.toFixed(2).replace('.', ',')} h`} />
        <SummaryRow styles={styles} label="Complementarias" value={`${payrollSummary.complementaryHours.toFixed(2).replace('.', ',')} h`} />
        <SummaryRow styles={styles} label="Festivas" value={`${payrollSummary.holidayHours.toFixed(2).replace('.', ',')} h`} />
      </View>

      <View style={styles.groupedPanel}>
        <Text style={styles.groupedPanelTitle}>Estimación salarial</Text>
        <SummaryRow styles={styles} label="Salario base" value={formatCurrency(payrollSummary.baseSalary)} />
        <SummaryRow
          styles={styles}
          label="Horas extras"
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
                label={`${normalizeTime(range.start_time)} - ${normalizeTime(range.end_time)}`}
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
        {payrollSummary.additionRows.map((addition) => (
          <SummaryRow
            key={addition.id}
            styles={styles}
            label={addition.name}
            value={formatCurrency(addition.total)}
            detail={getAdditionDetail(addition.mode, addition.quantity, Number(addition.amount || 0))}
          />
        ))}
        <SummaryRow styles={styles} label="Total bruto" value={formatCurrency(payrollSummary.grossSalary)} />
      </View>

      <View style={styles.groupedPanel}>
        <Text style={styles.groupedPanelTitle}>Resultado estimado</Text>
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
        <SummaryRow styles={styles} label="Neto estimado" value={formatCurrency(payrollSummary.estimatedNetSalary)} />
      </View>
    </>
  )
}
