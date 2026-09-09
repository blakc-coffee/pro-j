import { getActiveTheme, lightTheme, darkTheme, themes } from './theme';

export { lightTheme, darkTheme, themes };

/**
 * Dynamic colors proxy that forwards all token lookups to the currently active theme.
 * Guarantees 100% backward compatibility for all components importing `colors`.
 */
export const colors = new Proxy({}, {
  get(_, prop) {
    const active = getActiveTheme();
    return active[prop];
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
      value: getActiveTheme()[prop],
    };
  },
});
