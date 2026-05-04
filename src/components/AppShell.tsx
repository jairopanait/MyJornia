import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { BottomNav } from './BottomNav'
import type { AppColors, AppStyles } from '../theme'
import type { AppTab } from '../types'

type AppShellProps = {
  activeTab: AppTab
  children: ReactNode
  colors: AppColors
  isDark: boolean
  setActiveTab: (tab: AppTab) => void
  styles: AppStyles
  title: string
}

export function AppShell({ activeTab, children, colors, isDark, setActiveTab, styles, title }: AppShellProps) {
  return (
    <SafeAreaView style={styles.appScreen}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.homeHeader}>
            <View style={styles.homeTitleBlock}>
              <Text style={styles.homeTitle}>{title}</Text>
            </View>
            <View style={styles.homeActions} />
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNav activeTab={activeTab} colors={colors} setActiveTab={setActiveTab} styles={styles} />
    </SafeAreaView>
  )
}
