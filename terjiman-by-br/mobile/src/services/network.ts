import * as Network from 'expo-network';

/**
 * Offline check used to short-circuit requests before they are made.
 * When the platform cannot answer, we assume online: a false "offline" would
 * block a translation that would actually have worked.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
  } catch {
    return true;
  }
}
