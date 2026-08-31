import { StyleSheet, TextInput, View } from 'react-native';
import { MAX_TEXT_LENGTH, TEXT_LENGTH_WARNING } from '../constants/config';
import { AUTO_DETECT, getLanguage } from '../constants/languages';
import { FONTS, SPACING, TYPE_SCALE } from '../constants/theme';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import type { VoiceStatus } from '../hooks/useVoiceInput';
import { containsArabicScript, resolveTextDirection } from '../utils/text';
import { AppText } from './AppText';
import { Card } from './Card';
import { IconButton } from './IconButton';

export interface SourceInputCardProps {
  value: string;
  onChangeText: (text: string) => void;
  sourceLanguage: string;
  onClear: () => void;
  showMic: boolean;
  micStatus: VoiceStatus;
  onMicPress: () => void;
}

export function SourceInputCard({
  value,
  onChangeText,
  sourceLanguage,
  onClear,
  showMic,
  micStatus,
  onMicPress,
}: SourceInputCardProps) {
  const theme = useTheme();
  const { t, isRtl } = useI18n();

  const direction = resolveTextDirection(sourceLanguage, value);
  const rtl = direction === 'rtl';
  const placeholder =
    sourceLanguage === AUTO_DETECT
      ? t('home.placeholder')
      : (getLanguage(sourceLanguage)?.placeholder ?? t('home.placeholder'));

  // Pick the Arabic face when either the chosen language or the typed content
  // is Arabic-script, so the first keystroke already renders correctly.
  const fontFamily =
    rtl || containsArabicScript(value) ? FONTS.arabic.regular : FONTS.latin.regular;

  const nearLimit = value.length >= TEXT_LENGTH_WARNING;

  return (
    <Card>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubtle}
        multiline
        maxLength={MAX_TEXT_LENGTH}
        textAlignVertical="top"
        accessibilityLabel={placeholder}
        style={[
          styles.input,
          TYPE_SCALE.input,
          {
            color: theme.colors.text,
            fontFamily,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: direction,
          },
        ]}
      />

      <View
        style={[
          styles.footer,
          { borderTopColor: theme.colors.border, flexDirection: isRtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={[styles.actions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          {showMic ? (
            <IconButton
              icon={micStatus === 'recording' ? 'stop-circle' : 'mic-outline'}
              onPress={onMicPress}
              disabled={micStatus === 'transcribing'}
              active={micStatus === 'recording'}
              color={micStatus === 'recording' ? theme.colors.danger : undefined}
              accessibilityLabel={
                micStatus === 'recording' ? t('home.stopRecording') : t('home.startRecording')
              }
            />
          ) : null}
          {value.length > 0 ? (
            <IconButton
              icon="close-circle-outline"
              onPress={onClear}
              accessibilityLabel={t('home.clearInput')}
            />
          ) : null}
        </View>

        <AppText
          variant="caption"
          tone={nearLimit ? 'danger' : 'subtle'}
          accessibilityLabel={t('home.characters', { count: value.length, max: MAX_TEXT_LENGTH })}
        >
          {t('home.characters', { count: value.length, max: MAX_TEXT_LENGTH })}
        </AppText>
      </View>

      {micStatus !== 'idle' ? (
        <AppText variant="caption" tone="primary" style={styles.micStatus}>
          {micStatus === 'recording' ? t('home.recording') : t('home.transcribing')}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 132,
    maxHeight: 260,
    padding: 0,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  actions: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  micStatus: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
