import Constants from 'expo-constants';

const DEFAULT_PORT = 3000;

/**
 * Resolves the backend base URL.
 *
 * EXPO_PUBLIC_API_URL wins. Without it, a development build falls back to the
 * Metro host's LAN address so a physical device can reach a backend running on
 * the developer's machine — localhost would resolve to the phone itself.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${DEFAULT_PORT}`;

  return `http://localhost:${DEFAULT_PORT}`;
}

export const API_URL = resolveApiUrl();

/** Client-side guard; the backend enforces its own MAX_TEXT_LENGTH. */
export const MAX_TEXT_LENGTH = 5000;

/** Warn the user before they hit the hard limit. */
export const TEXT_LENGTH_WARNING = Math.floor(MAX_TEXT_LENGTH * 0.9);

export const REQUEST_TIMEOUT_MS = 60_000;

export const MAX_HISTORY_ITEMS = 100;

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const APP_NAME_LATIN = 'Terjiman by BR';
export const APP_NAME_NATIVE = 'تەرجىمان';
