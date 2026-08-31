import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../src/components/AppText';
import { Screen } from '../../src/components/Screen';
import { TranslationList } from '../../src/components/TranslationList';
import { SPACING } from '../../src/constants/theme';
import { useI18n } from '../../src/hooks/useI18n';
import { useRecordActions } from '../../src/hooks/useRecordActions';
import { useTheme } from '../../src/hooks/useTheme';
import { useHistoryStore } from '../../src/store/historyStore';

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t, isRtl } = useI18n();
  const items = useHistoryStore((state) => state.items);
  const actions = useRecordActions();

  const header = useMemo(
    () => (
      <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <View>
          <AppText variant="title" weight="bold">
            {t('history.title')}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('history.itemCount', { count: items.length })}
          </AppText>
        </View>

        <View style={[styles.headerActions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => router.push('/favorites')}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.headerButton}
          >
            <AppText variant="label" weight="semibold" tone="primary">
              {t('history.favorites')}
            </AppText>
          </Pressable>
          {items.length > 0 ? (
            <Pressable
              onPress={() => actions.clearAll(items.length)}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.headerButton}
            >
              <AppText variant="label" weight="semibold" color={theme.colors.danger}>
                {t('history.clearAll')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    ),
    [actions, isRtl, items.length, router, t, theme.colors.danger],
  );

  return (
    <Screen>
      <TranslationList
        items={items}
        header={header}
        empty={{ icon: 'time-outline', title: t('history.empty'), hint: t('history.emptyHint') }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  headerActions: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
