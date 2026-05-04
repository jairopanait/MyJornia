import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from '../../lib/supabase'

export function useAuthController() {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setInitializing(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitializing(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        ensureUserDefaults(nextSession.user.id, nextSession.user.email ?? '', nextSession.user.user_metadata?.full_name)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

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

    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.')
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

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  return {
    authMode,
    email,
    fullName,
    handleSignOut,
    handleSubmit,
    initializing,
    loading,
    password,
    session,
    setAuthMode,
    setEmail,
    setFullName,
    setPassword,
  }
}
