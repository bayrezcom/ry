import { useNetworkState } from 'expo-network';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Banner } from '../../src/components/Banner';
import { BrandHeader } from '../../src/components/BrandHeader';
import { IconButton } from '../../src/components/IconButton';
import { LanguageBar } from '../../src/components/LanguageBar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ResultCard } from '../../src/components/ResultCard';
import { Screen } from '../../src/components/Screen';
import { SourceInputCard } from '../../src/components/SourceInputCard';
import { SPACING } from '../../src/constants/theme';
import { useI18n } from '../../src/hooks/useI18n';
import { useVoiceInput } from '../../src/hooks/useVoiceInput';
import { copyToClipboard, shareTranslation } from '../../src/services/share';
import { haptic } from '../../src/services/feedback';
import { speak, stopSpeaking } from '../../src/services/speech';
import { useHistoryStore } from '../../src/store/historyStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTranslationStore } from '../../src/store/translationStore';
import { isEmptyText } from '../../src/utils/text';

const COPIED_RESET_MS = 1800;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settings = useSettingsStore((state) => state.settings);
  const historyItems = useHistoryStore((state) => state.items);

  const sourceLanguage = useTranslationStore((state) => state.sourceLanguage);
  const targetLanguage = useTranslationStore((state) => state.targetLanguage);
  const inputText = useTranslationStore((state) => state.inputText);
  const translatedText = useTranslationStore((state) => state.translatedText);
  const resultPair = useTranslationStore((state) => state.resultPair);
  const detected = useTranslationStore((state) => state.detected);
  const status = useTranslationStore((state) => state.status);
  const errorKey = useTranslationStore((state) => state.errorKey);
  const errorParams = useTranslationStore((state) => state.errorParams);

  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(false);

  const networkState = useNetworkState();
  const isOffline = networkState.isConnected === false;

  const handleTranscript = useCallback((text: string) => {
    useTranslationStore.getState().setInputFromTranscript(text);
  }, []);
  const voice = useVoiceInput(handleTranscript);

  const isLoading = status === 'loading';
  const hasResult = status === 'success' && translatedText !== '';
  const resultTarget = resultPair?.target ?? targetLanguage;

  // The record for the visible result, so the star reflects real stored state.
  const currentRecord = hasResult
    ? historyItems.find(
        (item) => item.translatedText === translatedText && item.sourceText === inputText.trim(),
      )
    : undefined;

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      void stopSpeaking();
    };
  }, []);

  // Bring a fresh result into view without yanking the page while typing.
  useEffect(() => {
    if (!hasResult) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [hasResult, translatedText]);

  const onTranslate = useCallback(async () => {
    void haptic('light', settings.hapticsEnabled);
    await useTranslationStore.getState().translate();
    const finalStatus = useTranslationStore.getState().status;
    void haptic(finalStatus === 'success' ? 'success' : 'error', settings.hapticsEnabled);
  }, [settings.hapticsEnabled]);

  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(translatedText);
    if (!ok) return;
    void haptic('light', settings.hapticsEnabled);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [settings.hapticsEnabled, translatedText]);

  const onShare = useCallback(async () => {
    void haptic('light', settings.hapticsEnabled);
    await shareTranslation({
      sourceText: inputText.trim(),
      translatedText,
      includeSignature: true,
      labels: {
        original: t('share.original'),
        translation: t('share.translation'),
        signature: t('share.signature'),
      },
    });
  }, [inputText, settings.hapticsEnabled, t, translatedText]);

  const onListen = useCallback(async () => {
    setSpeechError(false);
    if (isSpeaking) {
      await stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    await speak(translatedText, resultTarget, {
      onDone: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        setSpeechError(true);
      },
    });
  }, [isSpeaking, resultTarget, translatedText]);

  const onToggleFavorite = useCallback(() => {
    if (!currentRecord) return;
    void haptic('light', settings.hapticsEnabled);
    useHistoryStore.getState().toggleFavorite(currentRecord.id);
  }, [currentRecord, settings.hapticsEnabled]);

  const onSwap = useCallback(() => {
    void haptic('light', settings.hapticsEnabled);
    useTranslationStore.getState().swap();
  }, [settings.hapticsEnabled]);

  const translateDisabled = isEmptyText(inputText) || isOffline;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <BrandHeader
            right={
              <IconButton
                icon="star-outline"
                onPress={() => router.push('/favorites')}
                accessibilityLabel={t('history.favorites')}
                variant="outlined"
              />
            }
          />

          {isOffline ? (
            <Banner tone="info" message={t('home.offline')} hint={t('home.offlineHint')} />
          ) : null}

          <LanguageBar
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            detectedLanguage={detected?.code}
            onChangeSource={(code) => useTranslationStore.getState().setSourceLanguage(code)}
            onChangeTarget={(code) => useTranslationStore.getState().setTargetLanguage(code)}
            onSwap={onSwap}
          />

          <SourceInputCard
            value={inputText}
            onChangeText={(text) => useTranslationStore.getState().setInputText(text)}
            sourceLanguage={sourceLanguage}
            onClear={() => useTranslationStore.getState().clearInput()}
            showMic={settings.voiceInputEnabled}
            micStatus={voice.status}
            onMicPress={() => void voice.toggle(sourceLanguage)}
          />

          {voice.errorKey ? (
            <Banner
              tone="error"
              message={t(voice.errorKey)}
              onDismiss={voice.dismissError}
              dismissLabel={t('common.close')}
            />
          ) : null}

          {errorKey ? (
            <Banner
              tone="error"
              message={t(errorKey, errorParams)}
              onDismiss={() => useTranslationStore.getState().dismissError()}
              dismissLabel={t('common.close')}
              actionLabel={t('common.retry')}
              onAction={() => void onTranslate()}
            />
          ) : null}

          {speechError ? (
            <Banner
              tone="error"
              message={t('errors.speechUnavailable')}
              onDismiss={() => setSpeechError(false)}
              dismissLabel={t('common.close')}
            />
          ) : null}

          <View style={styles.translateRow}>
            <PrimaryButton
              label={isLoading ? t('home.translating') : t('home.translate')}
              onPress={() => void onTranslate()}
              loading={isLoading}
              disabled={translateDisabled}
              icon="sparkles-outline"
              style={styles.translateButton}
            />
            {isLoading ? (
              <PrimaryButton
                label={t('home.cancelTranslation')}
                onPress={() => useTranslationStore.getState().cancel()}
                variant="ghost"
              />
            ) : null}
          </View>

          {hasResult ? (
            <ResultCard
              text={translatedText}
              targetLanguage={resultTarget}
              copied={copied}
              isSpeaking={isSpeaking}
              isFavorite={currentRecord?.isFavorite ?? false}
              onCopy={() => void onCopy()}
              onShare={() => void onShare()}
              onListen={() => void onListen()}
              onToggleFavorite={onToggleFavorite}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  translateRow: {
    gap: SPACING.sm,
  },
  translateButton: {
    width: '100%',
  },
});
