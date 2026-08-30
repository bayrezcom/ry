import { useMemo } from 'react';
import { Screen } from '../src/components/Screen';
import { TranslationList } from '../src/components/TranslationList';
import { useI18n } from '../src/hooks/useI18n';
import { selectFavorites, useHistoryStore } from '../src/store/historyStore';

export default function FavoritesScreen() {
  const { t } = useI18n();
  const items = useHistoryStore((state) => state.items);
  const favorites = useMemo(() => selectFavorites(items), [items]);

  return (
    <Screen edges={['bottom']}>
      <TranslationList
        items={favorites}
        empty={{
          icon: 'star-outline',
          title: t('history.favoritesEmpty'),
          hint: t('history.favoritesEmptyHint'),
        }}
      />
    </Screen>
  );
}
