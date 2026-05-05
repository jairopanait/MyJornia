import { SafeAreaView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import type { AppStyles } from '../theme'

type ConfigErrorScreenProps = {
  isDark: boolean
  message: string
  styles: AppStyles
}

export function ConfigErrorScreen({ isDark, message, styles }: ConfigErrorScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.configPanel}>
        <Text style={styles.logo}>MyJornia</Text>
        <Text style={styles.formTitle}>Falta conectar Supabase</Text>
        <Text style={styles.configText}>{message}</Text>
        <Text style={styles.configCode}>EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co</Text>
        <Text style={styles.configCode}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave</Text>
      </View>
    </SafeAreaView>
  )
}
