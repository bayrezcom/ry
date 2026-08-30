import { create } from 'zustand';
import { MAX_HISTORY_ITEMS } from '../constants/config';
import { STORAGE_KEYS, loadJson, saveJson } from '../services/storage';
import type { TranslationRecord } from '../types';
import { createId } from '../utils/id';

export interface NewTranslationRecord {
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  detectedLanguage?: string;
}

interface HistoryState {
  items: TranslationRecord[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (record: NewTranslationRecord) => TranslationRecord;
  remove: (id: string) => void;
  clearAll: () => void;
  toggleFavorite: (id: string) => void;
  getById: (id: string) => TranslationRecord | undefined;
}

function isSameTranslation(record: TranslationRecord, candidate: NewTranslationRecord): boolean {
  return (
    record.sourceLanguage === candidate.sourceLanguage &&
    record.targetLanguage === candidate.targetLanguage &&
    record.sourceText === candidate.sourceText
  );
}

/** Records are newest-first and capped, so persistence stays small and fast. */
function normalize(items: TranslationRecord[]): TranslationRecord[] {
  return items.slice(0, MAX_HISTORY_ITEMS);
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    const stored = await loadJson<TranslationRecord[]>(STORAGE_KEYS.history, []);
    const items = Array.isArray(stored)
      ? stored.filter((item) => typeof item?.id === 'string' && typeof item?.sourceText === 'string')
      : [];
    set({ items: normalize(items), hydrated: true });
  },

  add: (candidate) => {
    const existing = get().items.find((item) => isSameTranslation(item, candidate));
    const record: TranslationRecord = {
      id: existing?.id ?? createId(),
      createdAt: Date.now(),
      // Re-translating something keeps its favorite flag.
      isFavorite: existing?.isFavorite ?? false,
      sourceLanguage: candidate.sourceLanguage,
      targetLanguage: candidate.targetLanguage,
      sourceText: candidate.sourceText,
      translatedText: candidate.translatedText,
      ...(candidate.detectedLanguage ? { detectedLanguage: candidate.detectedLanguage } : {}),
    };

    const items = normalize([record, ...get().items.filter((item) => item.id !== record.id)]);
    set({ items });
    void saveJson(STORAGE_KEYS.history, items);
    return record;
  },

  remove: (id) => {
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    void saveJson(STORAGE_KEYS.history, items);
  },

  clearAll: () => {
    set({ items: [] });
    void saveJson(STORAGE_KEYS.history, []);
  },

  toggleFavorite: (id) => {
    const items = get().items.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item,
    );
    set({ items });
    void saveJson(STORAGE_KEYS.history, items);
  },

  getById: (id) => get().items.find((item) => item.id === id),
}));

export function selectFavorites(items: TranslationRecord[]): TranslationRecord[] {
  return items.filter((item) => item.isFavorite);
}
