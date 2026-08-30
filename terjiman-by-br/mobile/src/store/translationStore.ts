import { create } from 'zustand';
import { MAX_TEXT_LENGTH } from '../constants/config';
import { AUTO_DETECT } from '../constants/languages';
import type { TranslationKey, TranslationParams } from '../i18n';
import { ApiError, errorMessageKey, translateText } from '../services/api';
import { isOnline } from '../services/network';
import type { DetectedLanguage, TranslationRecord, TranslationStatus } from '../types';
import {
  selectSource,
  selectTarget,
  swapLanguages,
  type LanguagePair,
} from '../utils/languagePair';
import { isEmptyText } from '../utils/text';
import { useHistoryStore } from './historyStore';

interface TranslationState {
  sourceLanguage: string;
  targetLanguage: string;
  inputText: string;
  translatedText: string;
  /** Language pair the visible result belongs to, so a later swap can't mislabel it. */
  resultPair: LanguagePair | null;
  detected: DetectedLanguage | null;
  status: TranslationStatus;
  errorKey: TranslationKey | null;
  errorParams: TranslationParams | undefined;
  /** Set while a request is in flight; also used to block duplicate submits. */
  controller: AbortController | null;

  setInputText: (text: string) => void;
  setSourceLanguage: (code: string) => void;
  setTargetLanguage: (code: string) => void;
  swap: () => void;
  clearInput: () => void;
  dismissError: () => void;
  cancel: () => void;
  translate: () => Promise<void>;
  applyRecord: (record: TranslationRecord) => void;
  applyDefaults: (source: string, target: string) => void;
  setInputFromTranscript: (text: string) => void;
}

const initialResultState = {
  translatedText: '',
  resultPair: null,
  detected: null,
  status: 'idle' as TranslationStatus,
  errorKey: null,
  errorParams: undefined,
};

export const useTranslationStore = create<TranslationState>((set, get) => ({
  sourceLanguage: AUTO_DETECT,
  targetLanguage: 'ug',
  inputText: '',
  controller: null,
  ...initialResultState,

  setInputText: (text) => {
    // Clearing the box clears the stale result with it.
    if (isEmptyText(text)) {
      set({ inputText: text, ...initialResultState });
      return;
    }
    set({ inputText: text.slice(0, MAX_TEXT_LENGTH), errorKey: null });
  },

  setSourceLanguage: (code) => {
    const pair = selectSource(
      { source: get().sourceLanguage, target: get().targetLanguage },
      code,
    );
    set({ sourceLanguage: pair.source, targetLanguage: pair.target, errorKey: null });
  },

  setTargetLanguage: (code) => {
    const pair = selectTarget(
      { source: get().sourceLanguage, target: get().targetLanguage },
      code,
    );
    set({ sourceLanguage: pair.source, targetLanguage: pair.target, errorKey: null });
  },

  swap: () => {
    const state = get();
    const pair = swapLanguages(
      { source: state.sourceLanguage, target: state.targetLanguage },
      state.detected?.code,
    );

    // With a result on screen, swapping continues the conversation: the
    // translation becomes the new input.
    const hasResult = state.status === 'success' && state.translatedText !== '';
    set({
      sourceLanguage: pair.source,
      targetLanguage: pair.target,
      ...(hasResult
        ? { inputText: state.translatedText, ...initialResultState }
        : { errorKey: null }),
    });
  },

  clearInput: () => {
    get().cancel();
    set({ inputText: '', ...initialResultState });
  },

  dismissError: () => set({ errorKey: null, errorParams: undefined }),

  cancel: () => {
    const { controller } = get();
    if (controller) {
      controller.abort();
      set({ controller: null, status: 'idle' });
    }
  },

  translate: async () => {
    const state = get();
    // Duplicate submits are dropped rather than queued.
    if (state.controller) return;

    const text = state.inputText.trim();
    if (isEmptyText(text)) {
      set({ errorKey: 'errors.emptyInput', errorParams: undefined, status: 'error' });
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      set({
        errorKey: 'errors.textTooLong',
        errorParams: { max: MAX_TEXT_LENGTH },
        status: 'error',
      });
      return;
    }

    // Never spend a request when the device knows it is offline.
    if (!(await isOnline())) {
      set({ errorKey: 'errors.offline', errorParams: undefined, status: 'error' });
      return;
    }

    const controller = new AbortController();
    set({ controller, status: 'loading', errorKey: null, errorParams: undefined });

    try {
      const response = await translateText({
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        text,
        signal: controller.signal,
      });

      set({
        controller: null,
        status: 'success',
        translatedText: response.translation,
        resultPair: { source: response.sourceLanguage, target: response.targetLanguage },
        detected: response.detectedLanguage ?? null,
        errorKey: null,
        errorParams: undefined,
      });

      useHistoryStore.getState().add({
        sourceLanguage: response.sourceLanguage,
        targetLanguage: response.targetLanguage,
        sourceText: text,
        translatedText: response.translation,
        ...(response.detectedLanguage ? { detectedLanguage: response.detectedLanguage.code } : {}),
      });
    } catch (error) {
      // A user-initiated cancel is not an error worth showing.
      if (error instanceof ApiError && error.code === 'CANCELLED') {
        set({ controller: null, status: 'idle' });
        return;
      }
      set({
        controller: null,
        status: 'error',
        errorKey: errorMessageKey(error),
        errorParams:
          error instanceof ApiError && error.code === 'TEXT_TOO_LONG'
            ? { max: MAX_TEXT_LENGTH }
            : undefined,
      });
    }
  },

  applyRecord: (record) => {
    get().cancel();
    set({
      sourceLanguage: record.sourceLanguage,
      targetLanguage: record.targetLanguage,
      inputText: record.sourceText,
      translatedText: record.translatedText,
      resultPair: { source: record.sourceLanguage, target: record.targetLanguage },
      detected: record.detectedLanguage ? { code: record.detectedLanguage, confidence: 1 } : null,
      status: 'success',
      errorKey: null,
      errorParams: undefined,
    });
  },

  applyDefaults: (source, target) => {
    // Only used at startup, before the user has touched anything.
    if (get().inputText !== '' || get().status !== 'idle') return;
    set({ sourceLanguage: source, targetLanguage: target });
  },

  setInputFromTranscript: (text) => {
    set({ inputText: text.slice(0, MAX_TEXT_LENGTH), ...initialResultState });
  },
}));
