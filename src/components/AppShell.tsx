import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { BottomNav } from './BottomNav'
import type { AppColors, AppStyles } from '../theme'
import type { AppTab, ThemeMode } from '../types'

type AppShellProps = {
  activeTab: AppTab
  children: ReactNode
  colors: AppColors
  handleSignOut: () => void
  isDark: boolean
  setActiveTab: (tab: AppTab) => void
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>
  styles: AppStyles
  title: string
}

export function AppShell({ activeTab, children, colors, handleSignOut, isDark, setActiveTab, setThemeMode, styles, title }: AppShellProps) {
  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.homeHeader}>
            <View style={styles.homeTitleBlock}>
              <Text style={styles.kicker}>MyWorkday</Text>
              <Text style={styles.homeTitle}>{title}</Text>
            </View>
            <View style={styles.homeActions}>
              <Pressable style={styles.modeButton} onPress={() => setThemeMode(isDark ? 'light' : 'dark')}>
                <Text style={styles.modeButtonText}>{isDark ? 'Claro' : 'Oscuro'}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
                <Text style={styles.secondaryButtonText}>Salir</Text>
              </Pressable>
            </View>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNav activeTab={activeTab} colors={colors} setActiveTab={setActiveTab} styles={styles} />
    </SafeAreaView>
  )
}
