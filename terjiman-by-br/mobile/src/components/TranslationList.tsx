import { FlatList, StyleSheet } from 'react-native';
import { SPACING } from '../constants/theme';
import { useRecordActions } from '../hooks/useRecordActions';
import type { TranslationRecord } from '../types';
import { EmptyState, type EmptyStateProps } from './EmptyState';
import { HistoryRow } from './HistoryRow';

export interface TranslationListProps {
  items: TranslationRecord[];
  empty: EmptyStateProps;
  header?: React.ReactElement | undefined;
}

export function TranslationList({ items, empty, header }: TranslationListProps) {
  const actions = useRecordActions();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header ?? null}
      ListEmptyComponent={<EmptyState {...empty} />}
      contentContainerStyle={styles.content}
      // History is capped at 100 records, so a modest window keeps scrolling
      // smooth without holding every row mounted.
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      renderItem={({ item }) => (
        <HistoryRow
          record={item}
          onOpen={actions.open}
          onCopy={actions.copy}
          onShare={actions.share}
          onDelete={actions.remove}
          onToggleFavorite={actions.toggleFavorite}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
    flexGrow: 1,
  },
});
