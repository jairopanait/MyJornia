import type { Dispatch, SetStateAction } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { appInfo } from '../constants'
import type { MfaController } from '../hooks/useMfaController'
import type { SecurityController } from '../hooks/useSecurityController'
import type { AppStyles } from '../theme'
import type { AdminStats, ThemeMode } from '../types'

const supportEmail = 'soporte@myworkday.app'

type ProfileScreenProps = {
  adminLoading: boolean
  adminStats: AdminStats | null
  greetingName: string
  handleSignOut: () => void
  isAdmin: boolean
  isDark: boolean
  loadAdminStats: () => void
  mfa: MfaController
  security: SecurityController
  sessionEmail?: string
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>
  styles: AppStyles
}

type MenuRowProps = {
  detail?: string
  isLast?: boolean
  onPress?: () => void
  styles: AppStyles
  title: string
  value?: string
}

function MenuRow({ detail, isLast = false, onPress, styles, title, value }: MenuRowProps) {
  const RowComponent = onPress ? Pressable : View

  return (
    <RowComponent style={[styles.menuRow, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
      <View style={styles.menuRowContent}>
        <Text style={styles.menuRowTitle}>{title}</Text>
        {detail ? <Text style={styles.menuRowDetail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.menuRowValue}>{value}</Text> : null}
      {onPress ? <Text style={styles.menuChevron}>›</Text> : null}
    </RowComponent>
  )
}

export function ProfileScreen({
  adminLoading,
  adminStats,
  greetingName,
  handleSignOut,
  isAdmin,
  isDark,
  loadAdminStats,
  mfa,
  security,
  sessionEmail,
  setThemeMode,
  styles,
}: ProfileScreenProps) {
  const openSupportEmail = () => {
    void Linking.openURL(`mailto:${supportEmail}?subject=Ayuda%20MyWorkday`)
  }

  const openPrivacyReference = () => {
    void Linking.openURL('https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion')
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Cuenta</Text>
      <View style={styles.groupedPanel}>
        <MenuRow styles={styles} title="Usuario" value={sessionEmail ?? greetingName} />
        {isAdmin ? <MenuRow styles={styles} title="Rol" value="Administrador" /> : null}
        <MenuRow styles={styles} title="Cerrar sesión" onPress={handleSignOut} isLast />
      </View>

      <Text style={styles.sectionTitle}>Seguridad</Text>
      <View style={styles.groupedPanel}>
        <MenuRow
          styles={styles}
          title="Bloqueo de app"
          value={security.appLockEnabled ? 'Activado' : 'Desactivado'}
          detail={
            security.biometricAvailable
              ? `Pedir ${security.biometricLabel} al volver a abrir MyWorkday`
              : 'Activa Face ID, huella o bloqueo seguro en tu móvil'
          }
          onPress={security.toggleAppLock}
        />
        <MenuRow
          styles={styles}
          title="Doble factor"
          value={mfa.verifiedFactors.length > 0 ? 'Activado' : mfa.enrollment ? 'Pendiente' : 'Desactivado'}
          detail="Código temporal con una app autenticadora"
          onPress={mfa.verifiedFactors.length === 0 && !mfa.enrollment ? mfa.beginEnrollment : undefined}
        />
        {mfa.enrollment ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.helperText}>Añade esta clave en tu app autenticadora y escribe el código que genere.</Text>
            <Text selectable style={styles.configCode}>
              {mfa.enrollment.secret}
            </Text>
            <TextInput
              autoComplete="one-time-code"
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={mfa.setEnrollmentCode}
              placeholder="Código de 6 dígitos"
              placeholderTextColor="#8A94A6"
              style={styles.input}
              textContentType="oneTimeCode"
              value={mfa.enrollmentCode}
            />
            <Pressable
              style={[styles.primaryButton, mfa.loading && styles.disabledButton]}
              onPress={mfa.verifyEnrollment}
              disabled={mfa.loading}
            >
              {mfa.loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Activar doble factor</Text>}
            </Pressable>
            <Pressable style={styles.authLinkButton} onPress={mfa.cancelEnrollment}>
              <Text style={styles.authLinkText}>Cancelar activación</Text>
            </Pressable>
          </View>
        ) : null}
        {mfa.verifiedFactors.length > 0 ? (
          <Pressable style={[styles.secondaryButton, { marginBottom: 14, marginTop: 4 }]} onPress={mfa.disableFirstFactor}>
            <Text style={styles.secondaryButtonText}>Desactivar doble factor</Text>
          </Pressable>
        ) : null}
        <MenuRow styles={styles} title="Sesión segura" value="Keychain/Keystore" detail="La sesión se guarda cifrada en el móvil" isLast />
      </View>

      <Text style={styles.sectionTitle}>Preferencias</Text>
      <View style={styles.groupedPanel}>
        <MenuRow
          styles={styles}
          title="Tema"
          value={isDark ? 'Oscuro' : 'Claro'}
          detail="Toca para cambiar entre claro y oscuro"
          onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
        />
        <MenuRow styles={styles} title="Idioma" value="Español" />
        <MenuRow styles={styles} title="Widgets" value="Próximamente" isLast />
      </View>

      <Text style={styles.sectionTitle}>Ayuda</Text>
      <View style={styles.groupedPanel}>
        <MenuRow styles={styles} title="Soporte" detail={supportEmail} onPress={openSupportEmail} />
        <MenuRow styles={styles} title="Política de privacidad" onPress={openPrivacyReference} isLast />
      </View>

      {isAdmin ? (
        <View style={styles.groupedPanel}>
          <Text style={styles.groupedPanelTitle}>Panel admin</Text>
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

      <Text style={styles.footerText}>
        Versión {appInfo.version}
        {'\n\n'}© {appInfo.company}
        {'\n'}
        {appInfo.madeIn}
        {'\n\n'}Diseño y desarrollo:
        {'\n'}
        {appInfo.designer}
      </Text>
    </>
  )
}
