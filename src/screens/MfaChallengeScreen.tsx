import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import type { AppStyles } from '../theme'

type MfaChallengeScreenProps = {
  challengeCode: string
  loading: boolean
  setChallengeCode: (value: string) => void
  styles: AppStyles
  verifyChallenge: () => Promise<void>
}

export function MfaChallengeScreen({ challengeCode, loading, setChallengeCode, styles, verifyChallenge }: MfaChallengeScreenProps) {
  return (
    <View style={[styles.loadingScreen, { paddingHorizontal: 24 }]}>
      <Text style={styles.loadingTitle}>Doble factor</Text>
      <Text style={[styles.helperText, { maxWidth: 310, textAlign: 'center' }]}>
        Introduce el código de 6 dígitos de tu app autenticadora para entrar en MyJornia.
      </Text>
      <TextInput
        autoComplete="one-time-code"
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={setChallengeCode}
        placeholder="000000"
        style={[styles.input, { fontSize: 24, fontWeight: '900', letterSpacing: 0, marginTop: 6, minWidth: 220, textAlign: 'center' }]}
        textContentType="oneTimeCode"
        value={challengeCode}
      />
      <Pressable style={[styles.primaryButton, loading && styles.disabledButton, { minWidth: 220, paddingHorizontal: 24 }]} onPress={verifyChallenge} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Verificar</Text>}
      </Pressable>
    </View>
  )
}
