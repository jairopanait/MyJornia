import { Text, View } from 'react-native'
import type { AppStyles } from '../theme'

type SummaryRowProps = {
  detail?: string
  label: string
  styles: AppStyles
  value: string
}

export function SummaryRow({ detail, label, styles, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.shiftInfo}>
        <Text style={styles.summaryRowLabel}>{label}</Text>
        {detail ? <Text style={styles.shiftMeta}>{detail}</Text> : null}
      </View>
      <Text style={styles.summaryRowValue}>{value}</Text>
    </View>
  )
}
