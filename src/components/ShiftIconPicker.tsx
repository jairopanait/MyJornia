import { Pressable, View } from 'react-native'
import { Briefcase, Coffee, Heart, Home, Moon, Plane, Star, Sun, Umbrella } from 'lucide-react-native'
import type { ComponentType } from 'react'
import type { SvgProps } from 'react-native-svg'
import type { AppColors, AppStyles } from '../theme'
import type { ShiftIconId } from '../types'

type LucideIcon = ComponentType<SvgProps & { color?: string; size?: number; strokeWidth?: number }>

const shiftIcons: Record<ShiftIconId, LucideIcon> = {
  briefcase: Briefcase,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  umbrella: Umbrella,
  star: Star,
  home: Home,
  heart: Heart,
  plane: Plane,
}

export const shiftIconOptions: ShiftIconId[] = ['briefcase', 'sun', 'moon', 'coffee', 'umbrella', 'star', 'home', 'heart', 'plane']

type ShiftIconProps = {
  color: string
  id?: ShiftIconId | null
  size?: number
}

export function ShiftIcon({ color, id = 'briefcase', size = 18 }: ShiftIconProps) {
  const Icon = shiftIcons[id ?? 'briefcase'] ?? Briefcase
  return <Icon color={color} size={size} strokeWidth={2.6} />
}

type ShiftIconPickerProps = {
  colors: AppColors
  onChange: (icon: ShiftIconId) => void
  styles: AppStyles
  value: ShiftIconId
}

export function ShiftIconPicker({ colors, onChange, styles, value }: ShiftIconPickerProps) {
  return (
    <View style={styles.iconPickerRow}>
      {shiftIconOptions.map((iconId) => {
        const isSelected = value === iconId

        return (
          <Pressable key={iconId} style={[styles.iconChoice, isSelected && styles.iconChoiceActive]} onPress={() => onChange(iconId)}>
            <ShiftIcon color={isSelected ? '#FFFFFF' : colors.blue} id={iconId} size={18} />
          </Pressable>
        )
      })}
    </View>
  )
}
