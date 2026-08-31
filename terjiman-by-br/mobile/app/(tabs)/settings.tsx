import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { LanguagePickerModal } from '../../src/components/LanguagePickerModal';
import { Screen } from '../../src/components/Screen';
import {
  SegmentedControl,
  SettingsRow,
  SettingsSection,
} from '../../src/components/SettingsRow';
import { APP_VERSION } from '../../src/constants/config';
import { AUTO_DETECT, getLanguage } from '../../src/constants/languages';
import { SPACING } from '../../src/constants/theme';
import { UI_LOCALES, UI_LOCALE_LABELS } from '../../src/i18n';
import { useI18n } from '../../src/hooks/useI18n';
import { checkHealth } from '../../src/services/api';
import { useSettingsStore } from '../../src/store/settingsStore';
import type { Appearance, UiLanguage } from '../../src/types';

type ServerStatus = 'checking' | 'online' | 'offline';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, isRtl } = useI18n();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [picker, setPicker] = useState<'source' | 'target' | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal)
      .then((health) => setServerStatus(health.aiConfigured ? 'online' : 'offline'))
      .catch(() => setServerStatus('offline'));
    return () => controller.abort();
  }, []);

  const sourceLabel =
    settings.defaultSourceLanguage === AUTO_DETECT
      ? t('home.autoDetect')
      : (getLanguage(settings.defaultSourceLanguage)?.name ?? settings.defaultSourceLanguage);
  const targetLabel =
    getLanguage(settings.defaultTargetLanguage)?.name ?? settings.defaultTargetLanguage;

  const serverLabel =
    serverStatus === 'checking'
      ? t('settings.serverChecking')
      : serverStatus === 'online'
        ? t('settings.serverOnline')
        : t('settings.serverOffline');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" weight="bold" style={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('settings.title')}
        </AppText>

        <SettingsSection title={t('settings.languageSection')}>
          <SettingsRow
            label={t('settings.defaultSource')}
            value={sourceLabel}
            onPress={() => setPicker('source')}
            showChevron
          />
          <SettingsRow
            label={t('settings.defaultTarget')}
            value={targetLabel}
            onPress={() => setPicker('target')}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title={t('settings.interfaceLanguage')}>
          <View style={styles.segmentWrapper}>
            <SegmentedControl<UiLanguage>
              accessibilityLabel={t('settings.interfaceLanguage')}
              value={settings.uiLanguage}
              onChange={(uiLanguage) => update({ uiLanguage })}
              options={[
                { value: 'system', label: t('settings.interfaceSystem') },
                ...UI_LOCALES.map((locale) => ({
                  value: locale as UiLanguage,
                  label: UI_LOCALE_LABELS[locale],
                })),
              ]}
            />
          </View>
        </SettingsSection>

        <SettingsSection title={t('settings.appearanceSection')}>
          <View style={styles.segmentWrapper}>
            <SegmentedControl<Appearance>
              accessibilityLabel={t('settings.appearance')}
              value={settings.appearance}
              onChange={(appearance) => update({ appearance })}
              options={[
                { value: 'system', label: t('settings.system') },
                { value: 'light', label: t('settings.light') },
                { value: 'dark', label: t('settings.dark') },
              ]}
            />
          </View>
        </SettingsSection>

        <SettingsSection title={t('settings.behaviourSection')}>
          <SettingsRow
            label={t('settings.haptics')}
            hint={t('settings.hapticsHint')}
            toggle={{
              value: settings.hapticsEnabled,
              onChange: (hapticsEnabled) => update({ hapticsEnabled }),
            }}
          />
          <SettingsRow
            label={t('settings.voiceInput')}
            hint={t('settings.voiceInputHint')}
            toggle={{
              value: settings.voiceInputEnabled,
              onChange: (voiceInputEnabled) => update({ voiceInputEnabled }),
            }}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.aboutSection')}>
          <SettingsRow label={t('settings.serverStatus')} value={serverLabel} />
          <SettingsRow
            label={t('settings.about')}
            onPress={() => router.push('/about')}
            showChevron
          />
          <SettingsRow label={t('settings.version')} value={APP_VERSION} />
        </SettingsSection>
      </ScrollView>

      <LanguagePickerModal
        visible={picker === 'source'}
        title={t('settings.defaultSource')}
        selectedCode={settings.defaultSourceLanguage}
        includeAutoDetect
        onSelect={(code) => {
          update({ defaultSourceLanguage: code });
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <LanguagePickerModal
        visible={picker === 'target'}
        title={t('settings.defaultTarget')}
        selectedCode={settings.defaultTargetLanguage}
        onSelect={(code) => {
          update({ defaultTargetLanguage: code });
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },
  segmentWrapper: {
    padding: SPACING.md,
  },
});
