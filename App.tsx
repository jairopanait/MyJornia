import { useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { supabaseConfigError } from './lib/supabase'
import { ActiveTabContent } from './src/components/ActiveTabContent'
import { AppShell } from './src/components/AppShell'
import { tabTitles } from './src/constants'
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
  const activeTabTitle = tabTitles[workday.activeTab]

  if (auth.initializing) {
    return <LoadingScreen colors={colors} styles={styles} />
  }

  if (auth.session) {
    return (
      <AppShell
        activeTab={workday.activeTab}
        colors={colors}
        handleSignOut={auth.handleSignOut}
        isDark={isDark}
        setActiveTab={workday.setActiveTab}
        setThemeMode={setThemeMode}
        styles={styles}
        title={activeTabTitle}
      >
        <ActiveTabContent colors={colors} controller={workday} sessionEmail={auth.session.user.email} styles={styles} />
      </AppShell>
    )
  }

  if (supabaseConfigError) {
    return <ConfigErrorScreen isDark={isDark} message={supabaseConfigError} styles={styles} />
  }

  return (
    <AuthScreen
      authMode={auth.authMode}
      colors={colors}
      email={auth.email}
      fullName={auth.fullName}
      handleSubmit={auth.handleSubmit}
      isDark={isDark}
      loading={auth.loading}
      password={auth.password}
      setAuthMode={auth.setAuthMode}
      setEmail={auth.setEmail}
      setFullName={auth.setFullName}
      setPassword={auth.setPassword}
      setThemeMode={setThemeMode}
      styles={styles}
    />
  )
}
