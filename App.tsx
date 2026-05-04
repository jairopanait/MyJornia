import { useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { supabaseConfigError } from './lib/supabase'
import { ActiveTabContent } from './src/components/ActiveTabContent'
import { AppShell } from './src/components/AppShell'
import { monthNames, tabTitles } from './src/constants'
import { useAuthController } from './src/hooks/useAuthController'
import { useWorkdayController } from './src/hooks/useWorkdayController'
import { AuthScreen } from './src/screens/AuthScreen'
import { ConfigErrorScreen } from './src/screens/ConfigErrorScreen'
import { LoadingScreen } from './src/screens/LoadingScreen'
import { createStyles, palettes } from './src/theme'
import type { ThemeMode } from './src/types'

export default function App() {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (systemScheme === 'dark' ? 'dark' : 'light'))
  const auth = useAuthController()
  const workday = useWorkdayController(auth.session)
  const isDark = themeMode === 'dark'
  const colors = palettes[themeMode]
  const styles = useMemo(() => createStyles(colors), [colors])
  const activeTabTitle = workday.activeTab === 'calendar' ? monthNames[workday.currentMonth.getMonth()] : tabTitles[workday.activeTab]

  if (auth.initializing) {
    return <LoadingScreen colors={colors} styles={styles} />
  }

  if (auth.session && !auth.passwordRecoveryMode) {
    return (
      <AppShell
        activeTab={workday.activeTab}
        colors={colors}
        isDark={isDark}
        setActiveTab={workday.setActiveTab}
        styles={styles}
        title={activeTabTitle}
      >
        <ActiveTabContent
          colors={colors}
          controller={workday}
          handleSignOut={auth.handleSignOut}
          isDark={isDark}
          sessionEmail={auth.session.user.email}
          setThemeMode={setThemeMode}
          styles={styles}
        />
      </AppShell>
    )
  }

  if (supabaseConfigError) {
    return <ConfigErrorScreen isDark={isDark} message={supabaseConfigError} styles={styles} />
  }

  return (
    <AuthScreen
      authMode={auth.authMode}
      cancelPasswordRecovery={auth.cancelPasswordRecovery}
      confirmNewPassword={auth.confirmNewPassword}
      email={auth.email}
      fullName={auth.fullName}
      handlePasswordReset={auth.handlePasswordReset}
      handleSubmit={auth.handleSubmit}
      handleUpdatePassword={auth.handleUpdatePassword}
      isDark={isDark}
      loading={auth.loading}
      newPassword={auth.newPassword}
      password={auth.password}
      passwordRecoveryMode={auth.passwordRecoveryMode}
      resetLoading={auth.resetLoading}
      setAuthMode={auth.setAuthMode}
      setConfirmNewPassword={auth.setConfirmNewPassword}
      setEmail={auth.setEmail}
      setFullName={auth.setFullName}
      setNewPassword={auth.setNewPassword}
      setPassword={auth.setPassword}
      styles={styles}
      updatingPassword={auth.updatingPassword}
    />
  )
}
