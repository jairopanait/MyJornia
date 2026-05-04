import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'
import type { AppColors, AppStyles } from '../theme'

type SelectOption = {
  label: string
  value: string
}

type SelectFieldProps = {
  colors: AppColors
  label: string
  onChange: (value: string) => void
  options: SelectOption[]
  styles: AppStyles
  value: string
}

export function SelectField({ colors, label, onChange, options, styles, value }: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dropdownTrigger} onPress={() => setOpen((nextOpen) => !nextOpen)}>
        <Text style={styles.dropdownTriggerText}>{selectedOption?.label ?? 'Seleccionar'}</Text>
        <ChevronDown size={18} color={colors.blue} />
      </Pressable>

      {open ? (
        <View style={styles.dropdownList}>
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <Pressable
                key={option.value || 'empty'}
                style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                onPress={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>{option.label}</Text>
                {isSelected ? <Check size={16} color="#FFFFFF" /> : null}
              </Pressable>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}
