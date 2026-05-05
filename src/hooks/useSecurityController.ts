import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AppState, type AppStateStatus } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const appLockStorageKey = 'myjornia:app-lock-enabled'
const securityInitTimeoutMs = 6500

type DeviceSecurityStatus = {
  available: boolean
  label: string
}

async function withTimeout<T>(promise: Promise<T>, fallback: T) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), securityInitTimeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export type SecurityController = {
  appLockEnabled: boolean
  appLocked: boolean
  authenticate: () => Promise<boolean>
  biometricAvailable: boolean
  biometricLabel: string
  initializing: boolean
  toggleAppLock: () => Promise<void>
}

function labelFromAuthenticationTypes(types: LocalAuthentication.AuthenticationType[]) {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID'
  }

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'huella'
  }

  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'biometría'
  }

  return 'bloqueo del móvil'
}

async function getStoredAppLockSetting() {
  try {
    if (await SecureStore.isAvailableAsync()) {
      return SecureStore.getItemAsync(appLockStorageKey)
    }
  } catch {
    return null
  }

  return null
}

async function setStoredAppLockSetting(value: 'true' | 'false') {
  try {
    if (!(await SecureStore.isAvailableAsync())) {
      return false
    }

    await SecureStore.setItemAsync(appLockStorageKey, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    })
    return true
  } catch {
    return false
  }
}

async function deleteStoredAppLockSetting() {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(appLockStorageKey)
    }
  } catch {
    // Si el almacén seguro no está disponible, basta con limpiar el estado en memoria.
  }
}

export function useSecurityController(session: Session | null): SecurityController {
  const [initializing, setInitializing] = useState(true)
  const [appLockEnabled, setAppLockEnabled] = useState(false)
  const [appLocked, setAppLocked] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLabel, setBiometricLabel] = useState('Face ID o huella')
  const appLockEnabledRef = useRef(false)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const authenticatingRef = useRef(false)
  const sessionRef = useRef<Session | null>(session)
  const unlockedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const refreshDeviceSecurity = useCallback(async (): Promise<DeviceSecurityStatus> => {
    try {
      const [hasHardware, isEnrolled, authenticationTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ])
      const nextLabel = labelFromAuthenticationTypes(authenticationTypes)
      const available = hasHardware && isEnrolled

      setBiometricAvailable(available)
      setBiometricLabel(nextLabel)

      return { available, label: nextLabel }
    } catch {
      setBiometricAvailable(false)
      return { available: false, label: 'bloqueo del móvil' }
    }
  }, [])

  const disableStoredAppLock = useCallback(async () => {
    appLockEnabledRef.current = false
    setAppLockEnabled(false)
    setAppLocked(false)
    await deleteStoredAppLockSetting()
  }, [])

  const authenticate = useCallback(async () => {
    if (authenticatingRef.current) {
      return false
    }

    authenticatingRef.current = true

    try {
      const deviceSecurity = await refreshDeviceSecurity()

      if (!deviceSecurity.available) {
        await disableStoredAppLock()
        Alert.alert(
          'Bloqueo no disponible',
          'Activa Face ID, huella o bloqueo seguro en tu móvil para proteger MyJornia.',
        )
        return false
      }

      const result = await LocalAuthentication.authenticateAsync({
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar código',
        promptMessage: 'Desbloquear MyJornia',
      })

      if (result.success) {
        setAppLocked(false)
        unlockedUserIdRef.current = sessionRef.current?.user.id ?? null
        return true
      }

      return false
    } catch {
      Alert.alert('No se pudo desbloquear', 'Vuelve a intentarlo en unos segundos.')
      return false
    } finally {
      authenticatingRef.current = false
    }
  }, [disableStoredAppLock, refreshDeviceSecurity])

  useEffect(() => {
    let mounted = true

    async function loadSecuritySettings() {
      const [storedValue, deviceSecurity] = await withTimeout(
        Promise.all([getStoredAppLockSetting(), refreshDeviceSecurity()]),
        [null, { available: false, label: 'bloqueo del móvil' }] as const,
      )

      if (!mounted) {
        return
      }

      const shouldEnableLock = storedValue === 'true' && deviceSecurity.available

      appLockEnabledRef.current = shouldEnableLock
      setAppLockEnabled(shouldEnableLock)

      if (storedValue === 'true' && !deviceSecurity.available) {
        await disableStoredAppLock()
      }

      setInitializing(false)
    }

    void loadSecuritySettings()

    return () => {
      mounted = false
    }
  }, [disableStoredAppLock, refreshDeviceSecurity])

  useEffect(() => {
    if (initializing) {
      return
    }

    if (!session) {
      setAppLocked(false)
      unlockedUserIdRef.current = null
      return
    }

    if (appLockEnabled && unlockedUserIdRef.current !== session.user.id) {
      setAppLocked(true)
      void authenticate()
    }
  }, [appLockEnabled, authenticate, initializing, session])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current
      appStateRef.current = nextState

      if (
        nextState === 'active' &&
        previousState.match(/inactive|background/) &&
        appLockEnabledRef.current &&
        sessionRef.current
      ) {
        setAppLocked(true)
        unlockedUserIdRef.current = null
        void authenticate()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [authenticate])

  const toggleAppLock = useCallback(async () => {
    if (appLockEnabledRef.current) {
      await disableStoredAppLock()
      Alert.alert('Bloqueo desactivado', 'MyJornia ya no pedirá desbloqueo al volver a la app.')
      return
    }

    const deviceSecurity = await refreshDeviceSecurity()

    if (!deviceSecurity.available) {
      Alert.alert(
        'Bloqueo no disponible',
        'Configura Face ID, huella o bloqueo seguro en los ajustes del móvil y vuelve a intentarlo.',
      )
      return
    }

    setAppLocked(true)
    const didAuthenticate = await authenticate()

    if (!didAuthenticate) {
      setAppLocked(false)
      return
    }

    const didPersistLock = await setStoredAppLockSetting('true')

    if (!didPersistLock) {
      setAppLocked(false)
      Alert.alert('No se pudo activar', 'El almacén seguro del móvil no está disponible ahora mismo.')
      return
    }

    appLockEnabledRef.current = true
    setAppLockEnabled(true)
    Alert.alert('Bloqueo activado', `MyJornia usará ${deviceSecurity.label} cuando vuelvas a la app.`)
  }, [authenticate, disableStoredAppLock, refreshDeviceSecurity])

  return {
    appLockEnabled,
    appLocked,
    authenticate,
    biometricAvailable,
    biometricLabel,
    initializing,
    toggleAppLock,
  }
}
