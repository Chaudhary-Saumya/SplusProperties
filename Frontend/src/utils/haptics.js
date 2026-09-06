/**
 * Native Haptic Feedback Utility
 * Supports Capacitor Haptics and Web Vibration API (navigator.vibrate)
 */

export const triggerHaptic = (type = 'light') => {
  try {
    // 1. Try Web Vibration API if supported on device
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(10);
          break;
        case 'medium':
        case 'impact':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([10, 30, 15]);
          break;
        case 'warning':
        case 'error':
          navigator.vibrate([25, 40, 25]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // Non-blocking fallback for browsers that disallow programmatic vibration
  }
};

export default triggerHaptic;
