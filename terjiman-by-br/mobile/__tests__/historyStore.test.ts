import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_HISTORY_ITEMS } from '../src/constants/config';
import { STORAGE_KEYS } from '../src/services/storage';
import { selectFavorites, useHistoryStore } from '../src/store/historyStore';

const base = {
  sourceLanguage: 'en',
  targetLanguage: 'ug',
  sourceText: 'Welcome to Dubai.',
  translatedText: 'دوبەيگە خۇش كەلدىڭىز.',
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useHistoryStore.setState({ items: [], hydrated: false });
});

describe('history storage', () => {
  it('adds a record and persists it', async () => {
    const record = useHistoryStore.getState().add(base);

    expect(record.id).toBeTruthy();
    expect(record.isFavorite).toBe(false);
    expect(useHistoryStore.getState().items).toHaveLength(1);

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.history);
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1);
  });

  it('keeps the newest record first', () => {
    useHistoryStore.getState().add(base);
    useHistoryStore.getState().add({ ...base, sourceText: 'Good morning.' });

    expect(useHistoryStore.getState().items[0]?.sourceText).toBe('Good morning.');
  });

  it('replaces an identical translation instead of duplicating it', () => {
    const first = useHistoryStore.getState().add(base);
    useHistoryStore.getState().toggleFavorite(first.id);
    const second = useHistoryStore.getState().add(base);

    expect(useHistoryStore.getState().items).toHaveLength(1);
    expect(second.id).toBe(first.id);
    // Re-translating must not silently drop the favorite flag.
    expect(second.isFavorite).toBe(true);
  });

  it('treats a different language pair as a separate record', () => {
    useHistoryStore.getState().add(base);
    useHistoryStore.getState().add({ ...base, targetLanguage: 'tr' });

    expect(useHistoryStore.getState().items).toHaveLength(2);
  });

  it(`caps history at ${MAX_HISTORY_ITEMS} records`, () => {
    for (let index = 0; index < MAX_HISTORY_ITEMS + 20; index += 1) {
      useHistoryStore.getState().add({ ...base, sourceText: `text ${index}` });
    }

    const { items } = useHistoryStore.getState();
    expect(items).toHaveLength(MAX_HISTORY_ITEMS);
    expect(items[0]?.sourceText).toBe(`text ${MAX_HISTORY_ITEMS + 19}`);
  });

  it('removes a single record', () => {
    const record = useHistoryStore.getState().add(base);
    useHistoryStore.getState().add({ ...base, sourceText: 'Another' });

    useHistoryStore.getState().remove(record.id);

    expect(useHistoryStore.getState().items).toHaveLength(1);
    expect(useHistoryStore.getState().getById(record.id)).toBeUndefined();
  });

  it('clears everything', async () => {
    useHistoryStore.getState().add(base);
    useHistoryStore.getState().clearAll();

    expect(useHistoryStore.getState().items).toEqual([]);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.history);
    expect(JSON.parse(raw ?? '[]')).toEqual([]);
  });

  it('hydrates from storage', async () => {
    useHistoryStore.getState().add(base);
    useHistoryStore.setState({ items: [], hydrated: false });

    await useHistoryStore.getState().hydrate();

    expect(useHistoryStore.getState().items).toHaveLength(1);
    expect(useHistoryStore.getState().hydrated).toBe(true);
  });

  it('survives a corrupt stored payload', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.history, 'not json');

    await useHistoryStore.getState().hydrate();

    expect(useHistoryStore.getState().items).toEqual([]);
    expect(useHistoryStore.getState().hydrated).toBe(true);
  });

  it('drops malformed entries when hydrating', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.history,
      JSON.stringify([{ id: 'a', sourceText: 'ok', translatedText: 'ok' }, { nope: true }]),
    );

    await useHistoryStore.getState().hydrate();

    expect(useHistoryStore.getState().items).toHaveLength(1);
  });
});

describe('favorites', () => {
  it('toggles on and off', () => {
    const record = useHistoryStore.getState().add(base);

    useHistoryStore.getState().toggleFavorite(record.id);
    expect(useHistoryStore.getState().getById(record.id)?.isFavorite).toBe(true);

    useHistoryStore.getState().toggleFavorite(record.id);
    expect(useHistoryStore.getState().getById(record.id)?.isFavorite).toBe(false);
  });

  it('selects only favorited records', () => {
    const first = useHistoryStore.getState().add(base);
    useHistoryStore.getState().add({ ...base, sourceText: 'Another' });
    useHistoryStore.getState().toggleFavorite(first.id);

    const favorites = selectFavorites(useHistoryStore.getState().items);
    expect(favorites).toHaveLength(1);
    expect(favorites[0]?.id).toBe(first.id);
  });

  it('persists the favorite flag', async () => {
    const record = useHistoryStore.getState().add(base);
    useHistoryStore.getState().toggleFavorite(record.id);
    useHistoryStore.setState({ items: [], hydrated: false });

    await useHistoryStore.getState().hydrate();

    expect(useHistoryStore.getState().items[0]?.isFavorite).toBe(true);
  });
});
