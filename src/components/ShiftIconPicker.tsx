import { Pressable, Text, View } from 'react-native'
import type { AppColors, AppStyles } from '../theme'
import type { ShiftIconId } from '../types'

const shiftEmojis: Record<ShiftIconId, string> = {
  briefcase: '💼',
  sun: '🌤️',
  moon: '🌙',
  coffee: '☕️',
  umbrella: '🏖️',
  star: '🎉',
  home: '🏠',
  heart: '💋',
  plane: '✈️',
}

export const shiftIconOptions: ShiftIconId[] = ['briefcase', 'sun', 'moon', 'coffee', 'umbrella', 'star', 'home', 'heart', 'plane']

type ShiftIconProps = {
  color: string
  id?: ShiftIconId | null
  size?: number
}

export function ShiftIcon({ id = 'briefcase', size = 18 }: ShiftIconProps) {
  return <Text style={{ fontSize: size, lineHeight: size + 3 }}>{shiftEmojis[id ?? 'briefcase'] ?? shiftEmojis.briefcase}</Text>
}

type ShiftIconPickerProps = {
  colors: AppColors
  onChange: (icon: ShiftIconId) => void
  styles: AppStyles
  value: ShiftIconId
}

export function ShiftIconPicker({ onChange, styles, value }: ShiftIconPickerProps) {
  return (
    <View style={styles.iconPickerRow}>
      {shiftIconOptions.map((iconId) => {
        const isSelected = value === iconId

        return (
          <Pressable key={iconId} style={[styles.iconChoice, isSelected && styles.iconChoiceActive]} onPress={() => onChange(iconId)}>
            <ShiftIcon color="#FFFFFF" id={iconId} size={21} />
          </Pressable>
        )
      })}
    </View>
  )
}
