import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../src/components/AppText';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { APP_NAME_LATIN, APP_NAME_NATIVE, APP_VERSION } from '../src/constants/config';
import { SPACING } from '../src/constants/theme';
import { useI18n } from '../src/hooks/useI18n';

export default function AboutScreen() {
  const { t, isRtl } = useI18n();
  const align = { textAlign: isRtl ? ('right' as const) : ('left' as const) };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <AppText variant="display" weight="bold">
            {APP_NAME_NATIVE}
          </AppText>
          <AppText variant="label" tone="muted">
            {APP_NAME_LATIN}
          </AppText>
        </View>

        <AppText variant="body" tone="muted" style={align}>
          {t('about.intro')}
        </AppText>

        <Card>
          <AppText variant="heading" weight="semibold" style={align}>
            {t('about.privacyTitle')}
          </AppText>
          <AppText variant="label" tone="muted" style={[styles.body, align]}>
            {t('about.privacyBody')}
          </AppText>
        </Card>

        <Card>
          <AppText variant="heading" weight="semibold" style={align}>
            {t('about.termsTitle')}
          </AppText>
          <AppText variant="label" tone="muted" style={[styles.body, align]}>
            {t('about.termsBody')}
          </AppText>
        </Card>

        <AppText variant="caption" tone="subtle" style={align}>
          {t('about.poweredBy')}
        </AppText>

        <AppText variant="caption" tone="subtle" style={align}>
          {t('about.versionLabel')}: {APP_VERSION}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  brand: {
    gap: 2,
  },
  body: {
    marginTop: SPACING.sm,
  },
});
