import { useEffect, useState } from 'react'
import { Alert, Linking } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from '../../lib/supabase'

const passwordResetRedirectUrl = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL || 'myjornia://password-reset'

function isStrongPassword(password: string) {
  const hasMinimumLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  return hasMinimumLength && hasNumber && hasSymbol
}

function getAuthParamsFromUrl(url: string) {
  const paramsText = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? ''
  return new URLSearchParams(paramsText)
}

export function useAuthController() {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setInitializing(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitializing(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true)
      }

      if (nextSession?.user) {
        ensureUserDefaults(nextSession.user.id, nextSession.user.email ?? '', nextSession.user.user_metadata?.full_name)
      }
    })

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleRecoveryUrl(url)
      }
    })

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleRecoveryUrl(url)
    })

    return () => {
      listener.subscription.unsubscribe()
      linkingSubscription.remove()
    }
  }, [])

  async function handleRecoveryUrl(url: string) {
    if (!supabase || (!url.includes('password-reset') && !url.includes('access_token') && !url.includes('code='))) {
      return
    }

    const params = getAuthParamsFromUrl(url)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const code = params.get('code')

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        Alert.alert('No se pudo abrir la recuperación', error.message)
        return
      }

      setPasswordRecoveryMode(true)
      return
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        Alert.alert('No se pudo abrir la recuperación', error.message)
        return
      }

      setPasswordRecoveryMode(true)
    }
  }

  async function ensureUserDefaults(userId: string, userEmail: string, userFullName?: string) {
    if (!supabase) {
      return
    }

    await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      full_name: userFullName ?? null,
    })

    await supabase.from('work_rules').upsert(
      {
        user_id: userId,
        night_start: '22:00',
        night_end: '06:00',
        monthly_extra_hours: 160,
        contract_hours: 160,
        base_salary: 0,
        complementary_hour_rate: 0,
        night_hour_rate: 0,
        holiday_hour_rate: 0,
        holiday_shift_rate: 0,
        holiday_pay_mode: 'hour',
      },
      { onConflict: 'user_id' },
    )
  }

  async function handleSubmit() {
    if (!supabase) {
      Alert.alert('Falta configuración', supabaseConfigError ?? 'No se pudo conectar con Supabase.')
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()

    if (!cleanEmail || !password) {
      Alert.alert('Faltan datos', 'Introduce correo y contraseña.')
      return
    }

    if (authMode === 'register' && !isStrongPassword(password)) {
      Alert.alert('Contraseña poco segura', 'Debe tener al menos 8 caracteres, un número y un símbolo.')
      return
    }

    setLoading(true)
    const response =
      authMode === 'register'
        ? await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanName || null,
              },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })
    setLoading(false)

    if (response.error) {
      Alert.alert('No se pudo continuar', response.error.message)
      return
    }

    if (authMode === 'register' && !response.data.session) {
      Alert.alert('Revisa tu correo', 'Supabase te ha enviado un correo para confirmar tu cuenta.')
    }
  }

  async function handlePasswordReset() {
    if (!supabase) {
      Alert.alert('Falta configuración', supabaseConfigError ?? 'No se pudo conectar con Supabase.')
      return
    }

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      Alert.alert('Falta correo', 'Introduce tu correo para enviarte la recuperación de contraseña.')
      return
    }

    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: passwordResetRedirectUrl,
    })
    setResetLoading(false)

    if (error) {
      Alert.alert('No se pudo enviar el correo', error.message)
      return
    }

    Alert.alert('Correo enviado', 'Revisa tu email para recuperar la contraseña.')
  }

  async function handleUpdatePassword() {
    if (!supabase) {
      Alert.alert('Falta configuración', supabaseConfigError ?? 'No se pudo conectar con Supabase.')
      return
    }

    if (!isStrongPassword(newPassword)) {
      Alert.alert('Contraseña poco segura', 'Debe tener al menos 8 caracteres, un número y un símbolo.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('No coinciden', 'Las dos contraseñas deben ser iguales.')
      return
    }

    setUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setUpdatingPassword(false)

    if (error) {
      Alert.alert('No se pudo cambiar la contraseña', error.message)
      return
    }

    setNewPassword('')
    setConfirmNewPassword('')
    setPassword('')
    setPasswordRecoveryMode(false)
    Alert.alert('Contraseña cambiada', 'Ya puedes usar tu nueva contraseña.')
  }

  async function cancelPasswordRecovery() {
    setPasswordRecoveryMode(false)
    setNewPassword('')
    setConfirmNewPassword('')
    await handleSignOut()
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  return {
    authMode,
    cancelPasswordRecovery,
    confirmNewPassword,
    email,
    fullName,
    handlePasswordReset,
    handleSignOut,
    handleSubmit,
    handleUpdatePassword,
    initializing,
    loading,
    newPassword,
    password,
    passwordRecoveryMode,
    resetLoading,
    session,
    setAuthMode,
    setConfirmNewPassword,
    setEmail,
    setFullName,
    setNewPassword,
    setPassword,
    updatingPassword,
  }
}
