import { useEffect, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import type { AppStyles } from '../theme'
import { formatNumber, parseNumber } from '../utils/payroll'

type DecimalInputProps = {
  label: string
  onValueChange: (value: number) => void
  placeholder?: string
  styles: AppStyles
  value: number
}

function formatDecimalText(value: number) {
  return formatNumber(value).replace('.', ',')
}

export function DecimalInput({ label, onValueChange, placeholder = '0', styles, value }: DecimalInputProps) {
  const [text, setText] = useState(() => formatDecimalText(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setText(formatDecimalText(value))
    }
  }, [focused, value])

  function handleChange(nextText: string) {
    const cleanText = nextText.replace(/[^\d,.-]/g, '')
    setText(cleanText)

    if (cleanText === '' || cleanText === '-' || cleanText.endsWith(',') || cleanText.endsWith('.')) {
      return
    }

    onValueChange(parseNumber(cleanText))
  }

  function handleBlur() {
    setFocused(false)
    const parsedValue = parseNumber(text)
    onValueChange(parsedValue)
    setText(formatDecimalText(parsedValue))
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={text}
        onBlur={handleBlur}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  )
}
