import { Pressable, Text, View } from 'react-native'
import { Banknote, BarChart3, CalendarDays, ClipboardList, Menu } from 'lucide-react-native'
import type { AppTab } from '../types'
import type { AppColors, AppStyles } from '../theme'

type BottomNavProps = {
  activeTab: AppTab
  colors: AppColors
  setActiveTab: (tab: AppTab) => void
  styles: AppStyles
}

const bottomTabs = [
  { id: 'summary' as const, label: 'Resumen', Icon: BarChart3 },
  { id: 'settings' as const, label: 'Nómina', Icon: Banknote },
  { id: 'calendar' as const, label: 'Calendario', Icon: CalendarDays },
  { id: 'shiftTypes' as const, label: 'Turnos', Icon: ClipboardList },
  { id: 'profile' as const, label: 'Más', Icon: Menu },
]

export function BottomNav({ activeTab, colors, setActiveTab, styles }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {bottomTabs.map(({ id, label, Icon }) => {
        const isActiveTab = activeTab === id
        const isCenterTab = id === 'calendar'

        return (
          <Pressable
            key={id}
            style={[styles.bottomNavItem, isCenterTab && styles.bottomNavCenter, isActiveTab && styles.bottomNavItemActive]}
            onPress={() => setActiveTab(id)}
          >
            <Icon size={isCenterTab ? 27 : 23} color={isActiveTab ? '#FFFFFF' : colors.muted} strokeWidth={2.7} />
            <Text style={[styles.bottomNavLabel, isActiveTab && styles.bottomNavLabelActive]}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
