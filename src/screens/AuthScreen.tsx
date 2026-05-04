import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import type { Dispatch, SetStateAction } from 'react'
import type { ThemeMode } from '../types'
import type { AppColors, AppStyles } from '../theme'

type AuthScreenProps = {
  authMode: 'login' | 'register'
  colors: AppColors
  email: string
  fullName: string
  handlePasswordReset: () => void
  handleSubmit: () => void
  isDark: boolean
  loading: boolean
  password: string
  resetLoading: boolean
  setAuthMode: Dispatch<SetStateAction<'login' | 'register'>>
  setEmail: (value: string) => void
  setFullName: (value: string) => void
  setPassword: (value: string) => void
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>
  styles: AppStyles
}

export function AuthScreen({
  authMode,
  colors,
  email,
  fullName,
  handlePasswordReset,
  handleSubmit,
  isDark,
  loading,
  password,
  resetLoading,
  setAuthMode,
  setEmail,
  setFullName,
  setPassword,
  setThemeMode,
  styles,
}: AuthScreenProps) {
  const isRegistering = authMode === 'register'
  const title = isRegistering ? 'Crear cuenta' : 'Iniciar sesión'

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
              <Pressable style={[styles.segmentButton, !isRegistering && styles.segmentButtonActive]} onPress={() => setAuthMode('login')}>
                <Text style={[styles.segmentText, !isRegistering && styles.segmentTextActive]}>Entrar</Text>
              </Pressable>
              <Pressable style={[styles.segmentButton, isRegistering && styles.segmentButtonActive]} onPress={() => setAuthMode('register')}>
                <Text style={[styles.segmentText, isRegistering && styles.segmentTextActive]}>Registro</Text>
              </Pressable>
            </View>

            <Text style={styles.formTitle}>{title}</Text>

            {isRegistering ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput value={fullName} onChangeText={setFullName} placeholder="Tu nombre" placeholderTextColor="#94A3B8" style={styles.input} />
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
                placeholder={isRegistering ? 'Mínimo 8, número y símbolo' : 'Tu contraseña'}
                placeholderTextColor="#94A3B8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            {!isRegistering ? (
              <Pressable style={styles.authLinkButton} onPress={handlePasswordReset} disabled={resetLoading}>
                <Text style={styles.authLinkText}>{resetLoading ? 'Enviando correo...' : '¿Olvidaste tu contraseña?'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.passwordHint}>Debe tener mínimo 8 caracteres, un número y un símbolo.</Text>
            )}

            <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{title}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
