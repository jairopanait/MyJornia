import { ActivityIndicator, SafeAreaView } from 'react-native'
import type { AppColors, AppStyles } from '../theme'

type LoadingScreenProps = {
  colors: AppColors
  styles: AppStyles
}

export function LoadingScreen({ colors, styles }: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={colors.blue} />
    </SafeAreaView>
  )
}
