import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { resolveUiLocale, type UiLocale } from '../i18n';
import { STORAGE_KEYS, loadJson, saveJson } from '../services/storage';
import type { Appearance, Settings, UiLanguage } from '../types';

const DEFAULT_SETTINGS: Settings = {
  defaultSourceLanguage: 'auto',
  defaultTargetLanguage: 'ug',
  appearance: 'system',
  uiLanguage: 'system',
  hapticsEnabled: true,
  voiceInputEnabled: true,
};

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  setAppearance: (appearance: Appearance) => void;
  setUiLanguage: (uiLanguage: UiLanguage) => void;
}

function deviceLocaleTags(): string[] {
  try {
    return getLocales().map((locale) => locale.languageTag);
  } catch {
    return [];
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const stored = await loadJson<Partial<Settings>>(STORAGE_KEYS.settings, {});
    // Merge over the defaults so a settings key added in a later version is
    // present even when an older payload is on disk.
    set({ settings: { ...DEFAULT_SETTINGS, ...stored }, hydrated: true });
  },

  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    void saveJson(STORAGE_KEYS.settings, settings);
  },

  setAppearance: (appearance) => get().update({ appearance }),
  setUiLanguage: (uiLanguage) => get().update({ uiLanguage }),
}));

/** Resolves the active UI locale from the setting plus the device locale list. */
export function selectUiLocale(state: SettingsState): UiLocale {
  return resolveUiLocale(state.settings.uiLanguage, deviceLocaleTags());
}

export { DEFAULT_SETTINGS };
