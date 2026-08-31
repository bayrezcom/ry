import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type Intensity = 'light' | 'medium' | 'success' | 'warning' | 'error';

/**
 * Haptics are a user setting, so every call takes the current preference.
 * Web has no haptics API — calling through would throw on every press.
 */
export async function haptic(intensity: Intensity, enabled: boolean): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    switch (intensity) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Device without a haptic engine; silently skip.
  }
}
