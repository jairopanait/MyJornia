import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { Pencil, Trash2 } from 'lucide-react-native'
import { ColorPicker } from '../components/ColorPicker'
import { ShiftIcon, ShiftIconPicker } from '../components/ShiftIconPicker'
import type { AppColors, AppStyles } from '../theme'
import type { ShiftIconId, ShiftType } from '../types'
import { normalizeTime } from '../utils/dates'

type ShiftTypesScreenProps = {
  colors: AppColors
  editingTemplateId: string | null
  handleDeleteTemplate: (templateId: string) => void
  handleSaveTemplate: () => void
  savingTemplate: boolean
  setTemplateColor: (value: string) => void
  setTemplateEnd: (value: string) => void
  setTemplateIcon: (value: ShiftIconId) => void
  setTemplateIsTimeOff: (value: boolean) => void
  setTemplateName: (value: string) => void
  setTemplateStart: (value: string) => void
  shiftTypes: ShiftType[]
  startEditTemplate: (template: ShiftType) => void
  styles: AppStyles
  templateColor: string
  templateEnd: string
  templateIcon: ShiftIconId
  templateIsTimeOff: boolean
  templateName: string
  templateStart: string
}

function getTemplateDuration(template: ShiftType) {
  if (template.is_time_off) {
    return 'Sin horas'
  }

  const start = normalizeTime(template.default_start_time) || '--:--'
  const end = normalizeTime(template.default_end_time) || '--:--'

  return `${start} - ${end}`
}

export function ShiftTypesScreen({
  colors,
  editingTemplateId,
  handleDeleteTemplate,
  handleSaveTemplate,
  savingTemplate,
  setTemplateColor,
  setTemplateEnd,
  setTemplateIcon,
  setTemplateIsTimeOff,
  setTemplateName,
  setTemplateStart,
  shiftTypes,
  startEditTemplate,
  styles,
  templateColor,
  templateEnd,
  templateIcon,
  templateIsTimeOff,
  templateName,
  templateStart,
}: ShiftTypesScreenProps) {
  return (
    <>
      <View style={styles.groupedPanel}>
        <Text style={styles.groupedPanelTitle}>Plantillas de turnos</Text>
        {shiftTypes.length === 0 ? (
          <Text style={styles.emptyText}>Aún no has creado turnos personalizados.</Text>
        ) : (
          <View style={styles.templateList}>
            {shiftTypes.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={[styles.roundedIconBadge, { backgroundColor: template.color }]}>
                  <ShiftIcon color="#FFFFFF" id={template.icon} size={24} />
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.shiftMeta}>{getTemplateDuration(template)}</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable style={styles.smallIconButton} onPress={() => startEditTemplate(template)}>
                    <Pencil size={16} color={colors.blue} />
                  </Pressable>
                  <Pressable style={styles.smallIconButton} onPress={() => handleDeleteTemplate(template.id)}>
                    <Trash2 size={16} color={colors.blue} />
                  </Pressable>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.formSectionTitle}>{editingTemplateId ? 'Editar plantilla' : 'Nueva plantilla'}</Text>
        <Text style={styles.helperText}>Guarda turnos para añadirlos rápido al calendario sin volver a escribir horarios.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput value={templateName} onChangeText={setTemplateName} style={styles.input} placeholder="Ej. Mañana" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Icono</Text>
          <ShiftIconPicker colors={colors} value={templateIcon} onChange={setTemplateIcon} styles={styles} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Color</Text>
          <ColorPicker value={templateColor} onChange={setTemplateColor} styles={styles} />
        </View>

        <View style={styles.actionSplit}>
          <Pressable style={[styles.actionButton, !templateIsTimeOff && styles.actionButtonActive]} onPress={() => setTemplateIsTimeOff(false)}>
            <Text style={[styles.actionButtonText, !templateIsTimeOff && styles.actionButtonTextActive]}>Con horas</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, templateIsTimeOff && styles.actionButtonActive]} onPress={() => setTemplateIsTimeOff(true)}>
            <Text style={[styles.actionButtonText, templateIsTimeOff && styles.actionButtonTextActive]}>Sin horas</Text>
          </Pressable>
        </View>

        {!templateIsTimeOff ? (
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.label}>Inicio</Text>
              <TextInput value={templateStart} onChangeText={setTemplateStart} style={styles.input} placeholder="08:00" placeholderTextColor="#94A3B8" />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.label}>Fin</Text>
              <TextInput value={templateEnd} onChangeText={setTemplateEnd} style={styles.input} placeholder="16:00" placeholderTextColor="#94A3B8" />
            </View>
          </View>
        ) : null}

        <Pressable style={[styles.primaryButton, savingTemplate && styles.disabledButton]} onPress={handleSaveTemplate} disabled={savingTemplate}>
          {savingTemplate ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingTemplateId ? 'Guardar plantilla' : 'Crear plantilla'}</Text>}
        </Pressable>
      </View>
    </>
  )
}
