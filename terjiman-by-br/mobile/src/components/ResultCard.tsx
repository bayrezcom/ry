import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getLanguage, isRtlLanguage } from '../constants/languages';
import { SPACING } from '../constants/theme';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';
import { Card } from './Card';
import { IconButton } from './IconButton';

export interface ResultCardProps {
  text: string;
  targetLanguage: string;
  copied: boolean;
  isSpeaking: boolean;
  isFavorite: boolean;
  onCopy: () => void;
  onShare: () => void;
  onListen: () => void;
  onToggleFavorite: () => void;
}

export function ResultCard({
  text,
  targetLanguage,
  copied,
  isSpeaking,
  isFavorite,
  onCopy,
  onShare,
  onListen,
  onToggleFavorite,
}: ResultCardProps) {
  const theme = useTheme();
  const { t, isRtl } = useI18n();
  const rtl = isRtlLanguage(targetLanguage);
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  return (
    <Animated.View entering={FadeIn.duration(220)}>
      <Card style={{ borderColor: theme.colors.borderStrong }}>
        <View style={[styles.header, { flexDirection: rowDirection }]}>
          <AppText variant="caption" weight="semibold" tone="subtle">
            {t('home.result')} · {getLanguage(targetLanguage)?.name ?? targetLanguage}
          </AppText>
          <IconButton
            icon={isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={isFavorite ? theme.colors.favorite : theme.colors.textSubtle}
            onPress={onToggleFavorite}
            accessibilityLabel={isFavorite ? t('home.removeFavorite') : t('home.addFavorite')}
            style={styles.starButton}
          />
        </View>

        <AppText
          variant="result"
          selectable
          style={{ textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }}
        >
          {text}
        </AppText>

        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border, flexDirection: rowDirection },
          ]}
        >
          <ActionButton
            icon={copied ? 'checkmark' : 'copy-outline'}
            label={copied ? t('home.copied') : t('home.copy')}
            onPress={onCopy}
            highlighted={copied}
          />
          <ActionButton icon="share-outline" label={t('home.share')} onPress={onShare} />
          <ActionButton
            icon={isSpeaking ? 'stop' : 'volume-high-outline'}
            label={isSpeaking ? t('home.stopListening') : t('home.listen')}
            onPress={onListen}
            highlighted={isSpeaking}
          />
        </View>
      </Card>
    </Animated.View>
  );
}

interface ActionButtonProps {
  icon: React.ComponentProps<typeof IconButton>['icon'];
  label: string;
  onPress: () => void;
  highlighted?: boolean;
}

function ActionButton({ icon, label, onPress, highlighted = false }: ActionButtonProps) {
  const theme = useTheme();
  return (
    <View style={styles.action}>
      <IconButton
        icon={icon}
        onPress={onPress}
        accessibilityLabel={label}
        color={highlighted ? theme.colors.primary : theme.colors.textMuted}
        size={20}
      />
      <AppText variant="caption" tone={highlighted ? 'primary' : 'muted'}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  starButton: {
    minWidth: 36,
    minHeight: 36,
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: {
    alignItems: 'center',
    gap: 2,
  },
});
