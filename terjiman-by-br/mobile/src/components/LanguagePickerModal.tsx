import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUTO_DETECT, LANGUAGES, type Language } from '../constants/languages';
import { RADIUS, SPACING, TOUCH_TARGET } from '../constants/theme';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';

export interface LanguagePickerModalProps {
  visible: boolean;
  title: string;
  selectedCode: string;
  /** Only the source side may offer Auto Detect. */
  includeAutoDetect?: boolean;
  /** Rendered as unavailable — used to stop the user picking the other side. */
  disabledCode?: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

interface Row {
  code: string;
  name: string;
  englishName: string;
  isRtl: boolean;
}

function toRow(language: Language): Row {
  return {
    code: language.code,
    name: language.name,
    englishName: language.englishName,
    isRtl: language.direction === 'rtl',
  };
}

export function LanguagePickerModal({
  visible,
  title,
  selectedCode,
  includeAutoDetect = false,
  disabledCode,
  onSelect,
  onClose,
}: LanguagePickerModalProps) {
  const theme = useTheme();
  const { t, isRtl } = useI18n();

  const rows: Row[] = [
    ...(includeAutoDetect
      ? [{ code: AUTO_DETECT, name: t('home.autoDetect'), englishName: '', isRtl: false }]
      : []),
    ...LANGUAGES.map(toRow),
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.colors.border, flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <AppText variant="title" weight="semibold">
            {title}
          </AppText>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={10}
            style={styles.close}
          >
            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          initialNumToRender={16}
          renderItem={({ item }) => {
            const selected = item.code === selectedCode;
            const disabled = item.code === disabledCode;
            return (
              <Pressable
                onPress={() => onSelect(item.code)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={item.englishName || item.name}
                style={({ pressed }) => [
                  styles.row,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: selected
                      ? theme.colors.surfaceMuted
                      : pressed
                        ? theme.colors.surfaceMuted
                        : 'transparent',
                    opacity: disabled ? 0.35 : 1,
                  },
                ]}
              >
                <View style={styles.rowText}>
                  <AppText
                    variant="body"
                    weight={selected ? 'semibold' : 'regular'}
                    style={{ textAlign: item.isRtl ? 'right' : 'left', writingDirection: item.isRtl ? 'rtl' : 'ltr' }}
                  >
                    {item.name}
                  </AppText>
                  {item.englishName && item.englishName !== item.name ? (
                    <AppText variant="caption" tone="subtle">
                      {item.englishName}
                    </AppText>
                  ) : null}
                </View>
                {selected ? (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH_TARGET + 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
});
