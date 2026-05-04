import { Pressable, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { colorOptions } from '../constants'
import type { AppStyles } from '../theme'

type ColorPickerProps = {
  value: string
  onChange: (color: string) => void
  styles: AppStyles
}

export function ColorPicker({ onChange, styles, value }: ColorPickerProps) {
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
