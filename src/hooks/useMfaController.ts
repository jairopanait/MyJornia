import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

type TotpFactor = {
  id: string
  friendly_name?: string
}

type TotpEnrollment = {
  factorId: string
  secret: string
  uri: string
}

export type MfaController = {
  beginEnrollment: () => Promise<void>
  cancelEnrollment: () => Promise<void>
  challengeCode: string
  challengeRequired: boolean
  disableFirstFactor: () => void
  enrollment: TotpEnrollment | null
  enrollmentCode: string
  initializing: boolean
  loading: boolean
  refreshMfaState: () => Promise<void>
  setChallengeCode: (value: string) => void
  setEnrollmentCode: (value: string) => void
  verifiedFactors: TotpFactor[]
  verifyChallenge: () => Promise<void>
  verifyEnrollment: () => Promise<void>
}

function cleanOtpCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.'
}

export function useMfaController(session: Session | null): MfaController {
  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [challengeRequired, setChallengeRequired] = useState(false)
  const [challengeFactorId, setChallengeFactorId] = useState<string | null>(null)
  const [challengeCode, setChallengeCodeState] = useState('')
  const [verifiedFactors, setVerifiedFactors] = useState<TotpFactor[]>([])
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [enrollmentCode, setEnrollmentCodeState] = useState('')

  const setChallengeCode = useCallback((value: string) => {
    setChallengeCodeState(cleanOtpCode(value))
  }, [])

  const setEnrollmentCode = useCallback((value: string) => {
    setEnrollmentCodeState(cleanOtpCode(value))
  }, [])

  const refreshMfaState = useCallback(async () => {
    if (!supabase || !session) {
      setInitializing(false)
      setChallengeRequired(false)
      setChallengeFactorId(null)
      setVerifiedFactors([])
      return
    }

    setInitializing(true)

    try {
      const [{ data: factorsData, error: factorsError }, { data: aalData, error: aalError }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ])

      if (factorsError) {
        throw factorsError
      }

      if (aalError) {
        throw aalError
      }

      const nextVerifiedFactors = factorsData.totp.map((factor) => ({
        id: factor.id,
        friendly_name: factor.friendly_name,
      }))
      const mustVerifySecondFactor = aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2' && nextVerifiedFactors.length > 0

      setVerifiedFactors(nextVerifiedFactors)
      setChallengeRequired(mustVerifySecondFactor)
      setChallengeFactorId(mustVerifySecondFactor ? nextVerifiedFactors[0].id : null)
      setChallengeCodeState('')
    } catch (error) {
      Alert.alert('No se pudo revisar el doble factor', getErrorMessage(error))
      setChallengeRequired(false)
      setChallengeFactorId(null)
    } finally {
      setInitializing(false)
    }
  }, [session])

  useEffect(() => {
    void refreshMfaState()
  }, [refreshMfaState])

  const verifyChallenge = useCallback(async () => {
    if (!supabase || !challengeFactorId) {
      return
    }

    if (challengeCode.length !== 6) {
      Alert.alert('Código incompleto', 'Introduce los 6 dígitos de tu app autenticadora.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: challengeFactorId,
      code: challengeCode,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Código incorrecto', error.message)
      return
    }

    setChallengeRequired(false)
    setChallengeFactorId(null)
    setChallengeCodeState('')
    await refreshMfaState()
  }, [challengeCode, challengeFactorId, refreshMfaState])

  const beginEnrollment = useCallback(async () => {
    if (!supabase) {
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'MyWorkday',
    })
    setLoading(false)

    if (error) {
      Alert.alert('No se pudo activar', error.message)
      return
    }

    setEnrollment({
      factorId: data.id,
      secret: data.totp.secret,
      uri: data.totp.uri,
    })
    setEnrollmentCodeState('')
  }, [])

  const verifyEnrollment = useCallback(async () => {
    if (!supabase || !enrollment) {
      return
    }

    if (enrollmentCode.length !== 6) {
      Alert.alert('Código incompleto', 'Introduce los 6 dígitos de tu app autenticadora.')
      return
    }

    setLoading(true)
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId })

    if (challenge.error) {
      setLoading(false)
      Alert.alert('No se pudo verificar', challenge.error.message)
      return
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: enrollmentCode,
    })
    setLoading(false)

    if (error) {
      Alert.alert('Código incorrecto', error.message)
      return
    }

    setEnrollment(null)
    setEnrollmentCodeState('')
    Alert.alert('Doble factor activado', 'Tu cuenta queda protegida con código de autenticador.')
    await refreshMfaState()
  }, [enrollment, enrollmentCode, refreshMfaState])

  const cancelEnrollment = useCallback(async () => {
    if (supabase && enrollment) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId })
    }

    setEnrollment(null)
    setEnrollmentCodeState('')
  }, [enrollment])

  const unenrollFactor = useCallback(
    async (factorId: string) => {
      if (!supabase) {
        return
      }

      setLoading(true)
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      setLoading(false)

      if (error) {
        Alert.alert('No se pudo desactivar', error.message)
        return
      }

      Alert.alert('Doble factor desactivado', 'La cuenta vuelve a usar solo correo y contraseña.')
      await refreshMfaState()
    },
    [refreshMfaState],
  )

  const disableFirstFactor = useCallback(() => {
    const factor = verifiedFactors[0]

    if (!factor) {
      return
    }

    Alert.alert('Desactivar doble factor', 'La cuenta quedará menos protegida. ¿Seguro que quieres desactivarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: () => {
          void unenrollFactor(factor.id)
        },
      },
    ])
  }, [unenrollFactor, verifiedFactors])

  return {
    beginEnrollment,
    cancelEnrollment,
    challengeCode,
    challengeRequired,
    disableFirstFactor,
    enrollment,
    enrollmentCode,
    initializing,
    loading,
    refreshMfaState,
    setChallengeCode,
    setEnrollmentCode,
    verifiedFactors,
    verifyChallenge,
    verifyEnrollment,
  }
}
