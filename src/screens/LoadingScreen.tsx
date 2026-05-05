import { ActivityIndicator, Image, SafeAreaView, Text } from 'react-native'
import type { AppColors, AppStyles } from '../theme'

type LoadingScreenProps = {
  colors: AppColors
  styles: AppStyles
}

export function LoadingScreen({ colors, styles }: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <Image source={require('../../assets/splash-icon.png')} style={styles.loadingLogo} resizeMode="contain" />
      <Text style={styles.loadingTitle}>MyJornia</Text>
      <ActivityIndicator size="large" color={colors.blue} />
    </SafeAreaView>
  )
}
