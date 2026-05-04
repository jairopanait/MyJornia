import { Image, Pressable, Text, View } from 'react-native'
import type { AppStyles } from '../theme'

type SecurityLockScreenProps = {
  authenticate: () => Promise<boolean>
  biometricLabel: string
  styles: AppStyles
}

export function SecurityLockScreen({ authenticate, biometricLabel, styles }: SecurityLockScreenProps) {
  return (
    <View style={styles.loadingScreen}>
      <Image source={require('../../assets/splash-icon.png')} style={styles.loadingLogo} resizeMode="contain" />
      <Text style={styles.loadingTitle}>MyWorkday</Text>
      <Text style={[styles.helperText, { maxWidth: 300, textAlign: 'center' }]}>
        La app está bloqueada para proteger tus turnos, nóminas y datos personales.
      </Text>
      <Pressable style={[styles.primaryButton, { minWidth: 220, paddingHorizontal: 24 }]} onPress={authenticate}>
        <Text style={styles.primaryButtonText}>Desbloquear con {biometricLabel}</Text>
      </Pressable>
    </View>
  )
}
