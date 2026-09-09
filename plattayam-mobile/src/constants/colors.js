import { Platform } from 'react-native';
import { getActiveTheme, lightTheme, darkTheme, themes } from './theme';

export { lightTheme, darkTheme, themes };

/**
 * Dynamic colors proxy that forwards all token lookups to the currently active theme.
 * On React Native Web, returns CSS variable references `var(--color-prop, fallback)`
 * so that static StyleSheet.create styles automatically respond to live theme toggles
 * across EVERY single UI element on the page with zero re-rendering delays.
 * On native iOS/Android, dynamically reads from the active theme object.
 */
export const colors = new Proxy({}, {
  get(_, prop) {
    if (typeof prop !== 'string') {
      return undefined;
    }
    if (Platform.OS === 'web') {
      const fallback = lightTheme[prop];
      if (
        typeof fallback === 'string' &&
        (fallback.startsWith('#') || fallback.startsWith('rgb') || fallback.startsWith('rgba'))
      ) {
        return `var(--color-${prop}, ${fallback})`;
      }
    }
    const active = getActiveTheme();
    return active[prop] !== undefined ? active[prop] : lightTheme[prop];
  },
  set(_, prop, val) {
    const active = getActiveTheme();
    active[prop] = val;
    return true;
  },
  ownKeys() {
    return Reflect.ownKeys(getActiveTheme());
  },
  getOwnPropertyDescriptor(_, prop) {
    return {
      enumerable: true,
      configurable: true,
      value:
        Platform.OS === 'web' && typeof lightTheme[prop] === 'string'
          ? `var(--color-${prop}, ${lightTheme[prop]})`
          : getActiveTheme()[prop],
    };
  },
});
