import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from './lib/supabase'

type ThemeMode = 'light' | 'dark'

const palettes = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSoft: '#F4F7FC',
    text: '#050816',
    muted: '#526070',
    blue: '#0B57D0',
    blueStrong: '#0643A3',
    border: '#D8E2F0',
    input: '#F8FBFF',
    segment: '#E7EEF8',
    shadow: '#071225',
  },
  dark: {
    background: '#050816',
    surface: '#0B1220',
    surfaceSoft: '#111827',
    text: '#FFFFFF',
    muted: '#C8D3E1',
    blue: '#60A5FA',
    blueStrong: '#2563EB',
    border: '#1F2A44',
    input: '#0F172A',
    segment: '#172033',
    shadow: '#000000',
  },
}

type AppColors = (typeof palettes)[ThemeMode]

export default function App() {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (systemScheme === 'dark' ? 'dark' : 'light'))
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegistering = authMode === 'register'
  const title = isRegistering ? 'Crear cuenta' : 'Iniciar sesión'
  const isDark = themeMode === 'dark'
  const colors = palettes[themeMode]
  const styles = useMemo(() => createStyles(colors), [colors])

  const greetingName = useMemo(() => {
    return session?.user.user_metadata?.full_name || session?.user.email || 'usuario'
  }, [session])

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

    const response = isRegistering
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

    if (isRegistering && !response.data.session) {
      Alert.alert('Revisa tu correo', 'Supabase te ha enviado un correo para confirmar tu cuenta.')
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.blue} />
      </SafeAreaView>
    )
  }

  if (session) {
    return (
      <SafeAreaView style={styles.appScreen}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.kicker}>MyWorkday</Text>
            <Text style={styles.homeTitle}>Hola, {greetingName}</Text>
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

        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Siguiente paso</Text>
          <Text style={styles.summaryTitle}>Calendario de turnos</Text>
          <Text style={styles.summaryText}>
            Ya tienes sesión iniciada. Ahora construiremos el calendario mensual, los tipos de turno y los resúmenes de horas.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (supabaseConfigError) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.configPanel}>
          <Text style={styles.logo}>MyWorkday</Text>
          <Text style={styles.formTitle}>Falta conectar Supabase</Text>
          <Text style={styles.configText}>{supabaseConfigError}</Text>
          <Text style={styles.configCode}>EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co</Text>
          <Text style={styles.configCode}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <Text style={styles.logo}>MyWorkday</Text>
            <Text style={styles.headline}>Organiza tus turnos sin perder la cuenta de tus horas.</Text>
            <View style={styles.themeControl}>
              <Text style={styles.themeText}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
              <Switch
                value={isDark}
                onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')}
                trackColor={{ false: '#CBD5E1', true: colors.blueStrong }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.authPanel}>
            <View style={styles.segmentedControl}>
              <Pressable
                style={[styles.segmentButton, !isRegistering && styles.segmentButtonActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={[styles.segmentText, !isRegistering && styles.segmentTextActive]}>Entrar</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentButton, isRegistering && styles.segmentButtonActive]}
                onPress={() => setAuthMode('register')}
              >
                <Text style={[styles.segmentText, isRegistering && styles.segmentTextActive]}>Registro</Text>
              </Pressable>
            </View>

            <Text style={styles.formTitle}>{title}</Text>

            {isRegistering ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Tu nombre"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{title}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingScreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 28,
      paddingHorizontal: 24,
      paddingTop: 22,
    },
    brandBlock: {
      alignItems: 'center',
      marginBottom: 22,
      width: '100%',
    },
    logo: {
      color: colors.blue,
      fontSize: 36,
      fontWeight: '900',
      marginBottom: 16,
      textAlign: 'center',
      width: '100%',
    },
    headline: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 29,
      marginBottom: 16,
      maxWidth: 360,
      textAlign: 'center',
    },
    themeControl: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    themeText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '800',
    },
    authPanel: {
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      maxWidth: 390,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 26,
      width: '100%',
      elevation: 4,
    },
    segmentedControl: {
      backgroundColor: colors.segment,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 18,
      padding: 4,
    },
    segmentButton: {
      alignItems: 'center',
      borderRadius: 6,
      flex: 1,
      paddingVertical: 11,
    },
    segmentButtonActive: {
      backgroundColor: colors.surface,
    },
    segmentText: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: '800',
    },
    segmentTextActive: {
      color: colors.blue,
    },
    formTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 18,
      textAlign: 'center',
    },
    fieldGroup: {
      marginBottom: 14,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.input,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.blueStrong,
      borderRadius: 8,
      justifyContent: 'center',
      marginTop: 8,
      minHeight: 50,
      paddingVertical: 14,
    },
    disabledButton: {
      opacity: 0.65,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },
    appScreen: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
    },
    homeHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 26,
      marginTop: 18,
    },
    kicker: {
      color: colors.blue,
      fontSize: 14,
      fontWeight: '900',
      marginBottom: 6,
    },
    homeTitle: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '900',
    },
    homeActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    modeButton: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    modeButtonText: {
      color: colors.blue,
      fontSize: 13,
      fontWeight: '900',
    },
    secondaryButton: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    summaryPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: 20,
    },
    summaryLabel: {
      color: colors.blue,
      fontSize: 13,
      fontWeight: '900',
      marginBottom: 8,
    },
    summaryTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 10,
    },
    summaryText: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: 24,
    },
    configPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      margin: 24,
      padding: 18,
    },
    configText: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 14,
    },
    configCode: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: 6,
      color: colors.text,
      fontSize: 13,
      marginTop: 8,
      padding: 10,
    },
  })
