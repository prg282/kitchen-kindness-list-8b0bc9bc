/**
 * Lightweight haptic feedback helpers.
 * Silently no-ops on devices/browsers without the Vibration API (most desktops, iOS Safari).
 */
type HapticPattern = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  success: [12, 40, 18],
  warning: [24, 60, 24],
};

const PREF_KEY = 'haptics-enabled';

export function hapticsEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

export function haptic(pattern: HapticPattern = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (!hapticsEnabled()) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
