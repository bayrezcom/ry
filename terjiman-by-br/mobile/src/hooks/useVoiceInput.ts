import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ApiError, errorMessageKey, transcribeAudio } from '../services/api';
import { isOnline } from '../services/network';
import type { TranslationKey } from '../i18n';

export type VoiceStatus = 'idle' | 'recording' | 'transcribing';

export interface VoiceInput {
  status: VoiceStatus;
  errorKey: TranslationKey | null;
  /** Starts recording, or stops and transcribes when already recording. */
  toggle: (languageHint: string) => Promise<void>;
  cancel: () => void;
  dismissError: () => void;
}

/**
 * Voice input is fully isolated here: every failure path (permission denied,
 * no microphone, provider without speech-to-text, offline) resolves to an
 * error key and leaves text translation untouched.
 */
export function useVoiceInput(onTranscript: (text: string) => void): VoiceInput {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setErrorKey('errors.micPermission');
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      // iOS routes recording audio to the earpiece unless told otherwise.
      playsInSilentMode: true,
    });

    await recorder.prepareToRecordAsync();
    recorder.record();
    setStatus('recording');
  }, [recorder]);

  const stopAndTranscribe = useCallback(
    async (languageHint: string): Promise<void> => {
      await recorder.stop();
      const uri = recorder.uri;
      setStatus('transcribing');

      if (!uri) {
        setStatus('idle');
        setErrorKey('errors.recordingFailed');
        return;
      }

      if (!(await isOnline())) {
        setStatus('idle');
        setErrorKey('errors.offline');
        return;
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const result = await transcribeAudio({
          uri,
          fileName: `speech.${Platform.OS === 'ios' ? 'm4a' : 'm4a'}`,
          mimeType: 'audio/m4a',
          ...(languageHint ? { languageHint } : {}),
          signal: controller.signal,
        });
        if (result.text.trim() !== '') onTranscript(result.text.trim());
      } catch (error) {
        if (!(error instanceof ApiError && error.code === 'CANCELLED')) {
          setErrorKey(errorMessageKey(error));
        }
      } finally {
        controllerRef.current = null;
        setStatus('idle');
        await setAudioModeAsync({ allowsRecording: false });
      }
    },
    [onTranscript, recorder],
  );

  const toggle = useCallback(
    async (languageHint: string): Promise<void> => {
      setErrorKey(null);
      try {
        if (status === 'recording') {
          await stopAndTranscribe(languageHint);
        } else if (status === 'idle') {
          await startRecording();
        }
      } catch {
        setStatus('idle');
        setErrorKey('errors.recordingFailed');
      }
    },
    [startRecording, status, stopAndTranscribe],
  );

  const cancel = useCallback((): void => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (recorder.isRecording) void recorder.stop();
    setStatus('idle');
  }, [recorder]);

  return {
    status,
    errorKey,
    toggle,
    cancel,
    dismissError: () => setErrorKey(null),
  };
}
