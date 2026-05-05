import { useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { supabaseConfigError } from './lib/supabase'
import { ActiveTabContent } from './src/components/ActiveTabContent'
import { AppShell } from './src/components/AppShell'
import { monthNames, tabTitles } from './src/constants'
import { useAuthController } from './src/hooks/useAuthController'
import { useMfaController } from './src/hooks/useMfaController'
import { useSecurityController } from './src/hooks/useSecurityController'
import { useJorniaController } from './src/hooks/useJorniaController'
import { AuthScreen } from './src/screens/AuthScreen'
import { ConfigErrorScreen } from './src/screens/ConfigErrorScreen'
import { LoadingScreen } from './src/screens/LoadingScreen'
import { MfaChallengeScreen } from './src/screens/MfaChallengeScreen'
import { SecurityLockScreen } from './src/screens/SecurityLockScreen'
import { createStyles, palettes } from './src/theme'
import type { ThemeMode } from './src/types'

export default function App() {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (systemScheme === 'dark' ? 'dark' : 'light'))
  const auth = useAuthController()
  const securedSession = auth.passwordRecoveryMode ? null : auth.session
  const mfa = useMfaController(securedSession)
  const security = useSecurityController(securedSession)
  const jornia = useJorniaController(auth.passwordRecoveryMode || mfa.initializing || mfa.challengeRequired ? null : auth.session)
  const isDark = themeMode === 'dark'
  const colors = palettes[themeMode]
  const styles = useMemo(() => createStyles(colors), [colors])
  const activeTabTitle = jornia.activeTab === 'calendar' ? monthNames[jornia.currentMonth.getMonth()] : tabTitles[jornia.activeTab]

  if (auth.initializing || mfa.initializing || security.initializing) {
    return <LoadingScreen colors={colors} styles={styles} />
  }

  if (auth.session && !auth.passwordRecoveryMode) {
    if (mfa.challengeRequired) {
      return (
        <MfaChallengeScreen
          challengeCode={mfa.challengeCode}
          loading={mfa.loading}
          setChallengeCode={mfa.setChallengeCode}
          styles={styles}
          verifyChallenge={mfa.verifyChallenge}
        />
      )
    }

    if (security.appLocked) {
      return <SecurityLockScreen authenticate={security.authenticate} biometricLabel={security.biometricLabel} styles={styles} />
    }

    return (
      <AppShell
        activeTab={jornia.activeTab}
        colors={colors}
        isDark={isDark}
        setActiveTab={jornia.setActiveTab}
        styles={styles}
        title={activeTabTitle}
      >
        <ActiveTabContent
          colors={colors}
          controller={jornia}
          handleSignOut={auth.handleSignOut}
          isDark={isDark}
          mfa={mfa}
          security={security}
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
