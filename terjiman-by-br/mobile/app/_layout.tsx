import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-sans-arabic';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText } from '../src/components/AppText';
import { APP_NAME_NATIVE } from '../src/constants/config';
import { BRAND, FONTS, SPACING } from '../src/constants/theme';
import { useI18n } from '../src/hooks/useI18n';
import { useTheme } from '../src/hooks/useTheme';
import { useHistoryStore } from '../src/store/historyStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { useTranslationStore } from '../src/store/translationStore';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
  });

  const settingsHydrated = useSettingsStore((state) => state.hydrated);
  const historyHydrated = useHistoryStore((state) => state.hydrated);

  useEffect(() => {
    void useSettingsStore.getState().hydrate();
    void useHistoryStore.getState().hydrate();
  }, []);

  // Seed the picker from the saved defaults once, before the user interacts.
  useEffect(() => {
    if (!settingsHydrated) return;
    const { defaultSourceLanguage, defaultTargetLanguage } = useSettingsStore.getState().settings;
    useTranslationStore.getState().applyDefaults(defaultSourceLanguage, defaultTargetLanguage);
  }, [settingsHydrated]);

  const ready = fontsLoaded && settingsHydrated && historyHydrated;

  return (
    <SafeAreaProvider>
      {ready ? <ThemedNavigator /> : <BrandSplash />}
    </SafeAreaProvider>
  );
}

/** Shown for the few frames between launch and fonts/storage being ready. */
function BrandSplash() {
  return (
    <View style={[styles.splash, { backgroundColor: BRAND.primary }]}>
      <AppText
        variant="display"
        weight="bold"
        color="#FFFFFF"
        style={{ fontFamily: FONTS.arabic.bold }}
      >
        {APP_NAME_NATIVE}
      </AppText>
      <ActivityIndicator color="#FFFFFF" style={styles.splashSpinner} />
    </View>
  );
}

function ThemedNavigator() {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontFamily: FONTS.latin.semibold, color: theme.colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="favorites" options={{ title: t('history.favorites') }} />
        <Stack.Screen name="about" options={{ title: t('about.title') }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  splashSpinner: {
    marginTop: SPACING.md,
  },
});
