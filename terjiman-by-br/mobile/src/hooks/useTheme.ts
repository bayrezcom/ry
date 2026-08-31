import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';

/** Resolves the active theme from the user's Appearance setting. */
export function useTheme(): Theme {
  const appearance = useSettingsStore((state) => state.settings.appearance);
  const systemScheme = useColorScheme();
  const mode = appearance === 'system' ? (systemScheme ?? 'light') : appearance;
  return mode === 'dark' ? darkTheme : lightTheme;
}
