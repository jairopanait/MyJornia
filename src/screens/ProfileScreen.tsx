import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import type { AppStyles } from '../theme'
import type { AdminStats } from '../types'

type ProfileScreenProps = {
  adminLoading: boolean
  adminStats: AdminStats | null
  greetingName: string
  isAdmin: boolean
  loadAdminStats: () => void
  sessionEmail?: string
  styles: AppStyles
}

export function ProfileScreen({ adminLoading, adminStats, greetingName, isAdmin, loadAdminStats, sessionEmail, styles }: ProfileScreenProps) {
  return (
    <>
      <View style={styles.placeholderPanel}>
        <Text style={styles.placeholderTitle}>Perfil</Text>
        <Text style={styles.placeholderText}>Sesión iniciada como {sessionEmail ?? greetingName}.</Text>
        {isAdmin ? (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Administrador</Text>
          </View>
        ) : null}
      </View>

      {isAdmin ? (
        <View style={styles.dayPanel}>
          <Text style={styles.panelEyebrow}>Panel admin</Text>
          <Text style={styles.selectedDateTitle}>Vista global</Text>
          <View style={styles.adminStatsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{adminStats?.profiles ?? 0}</Text>
              <Text style={styles.statLabel}>Usuarios</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{adminStats?.shifts ?? 0}</Text>
              <Text style={styles.statLabel}>Turnos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{adminStats?.shiftTypes ?? 0}</Text>
              <Text style={styles.statLabel}>Plantillas</Text>
            </View>
          </View>
          <Pressable style={[styles.primaryButton, adminLoading && styles.disabledButton]} onPress={loadAdminStats} disabled={adminLoading}>
            {adminLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Actualizar panel</Text>}
          </Pressable>
        </View>
      ) : null}
    </>
  )
}
