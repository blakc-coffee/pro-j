/**
 * PLATTAYAM THEME SPECIFICATION
 * Central source of truth for all themes and color tokens.
 * 
 * Contains exactly 2 modes:
 * - light: The original Plattayam Warm Cream Editorial workspace theme.
 * - dark: Resend Black Velvet with Iris Violet Neon (pure black canvas, hairline graphite borders).
 */

export const lightTheme = {
  name: 'light',
  displayName: 'Light',
  isDark: false,
  statusBar: 'dark',

  // Canvas & Surfaces (Warm Cream Editorial)
  background: '#f7f5f2',
  card: '#ffffff',
  surfaceAlt: '#eee9e2',
  surfaceSubtle: '#f2eee9',

  // Typography
  foreground: '#1e1919',
  bodyText: '#1e1919',
  mutedForeground: '#716b61',
  subtleForeground: '#999388',
  disabled: '#b8b2a8',

  // Primary Action (Confident Blue)
  primary: '#0061fe',
  primaryForeground: '#ffffff',
  primarySoft: '#e8f0fe',

  // Secondary & Accent (Deep Magenta)
  secondary: '#eee9e2',
  accent: '#cd2f7b',
  accentForeground: '#ffffff',
  accentSoft: '#fce4ec',

  // Status Badges & Indicators
  success: '#107c41',
  successForeground: '#ffffff',
  successSoft: '#e6f4ea',

  warning: '#b35900',
  warningForeground: '#ffffff',
  warningSoft: '#fef7e0',

  destructive: '#b91c1c',
  destructiveForeground: '#ffffff',
  destructiveSoft: '#fee2e2',

  // Hairline Borders & Inputs
  border: '#eee9e2',
  borderLight: '#f2eee9',
  input: '#f7f5f2',
  inputBorder: '#e2ddd5',
  inputText: '#1e1919',
  inputPlaceholder: '#999388',
  ring: '#0061fe',

  // Special Chrome
  bellIcon: '#334155',
  badgeNotification: '#ec003f',
  badgeNotificationText: '#ffffff',
  avatarBackground: '#0061fe',
  avatarText: '#ffffff',
  tabBarBackground: '#ffffff',
  tabBarBorder: '#eee9e2',
  headerBackground: '#ffffff',
  headerBorder: '#eee9e2',

  white: '#ffffff',
  black: '#000000',
  scrim: 'rgba(15, 23, 42, 0.65)',
};

export const darkTheme = {
  name: 'dark',
  displayName: 'Dark',
  isDark: true,
  statusBar: 'light',

  // Canvas & Surfaces (Resend: Void Black & Surface Gradient)
  background: '#000000', // Void Black -- entire canvas
  card: '#000000',       // Cards sit on black with 1px hairline border
  surfaceAlt: '#0b0e14',  // Surface lift / subtle elevation
  surfaceSubtle: '#080a0e',

  // Typography (Resend: White, Bone White, Ash Gray, Smoke Gray)
  foreground: '#ffffff',         // White: primary headings, hero text, button labels
  bodyText: '#f0f0f0',           // Bone White: body text, secondary headings
  mutedForeground: '#a1a4a5',    // Ash Gray: muted body text, third-tier metadata
  subtleForeground: '#abafb4',   // Smoke Gray: captions, fourth-tier text
  disabled: '#6e727a',           // Iron: disabled states, low-emphasis
  charcoal: '#464a4d',           // Charcoal: muted labels

  // Primary Action (Resend: Signal Blue for filled actions)
  primary: '#3b9eff',            // Signal Blue
  primaryForeground: '#ffffff',
  primarySoft: 'rgba(59, 158, 255, 0.14)',

  // Brand Accent (Resend: Iris Violet)
  secondary: '#0b0e14',
  accent: '#9281f7',             // Iris Violet: links, tags, brand accents
  accentForeground: '#ffffff',
  accentSoft: 'rgba(146, 129, 247, 0.14)',
  accentGlow: '#baa7ff',

  // Status & Supporting Colors (Resend Data Accents)
  success: '#3ad389',            // Pulse Green
  successForeground: '#ffffff',
  successSoft: 'rgba(58, 211, 137, 0.14)',

  warning: '#ffca16',            // Amber
  warningForeground: '#000000',
  warningSoft: 'rgba(255, 202, 22, 0.14)',
  warningGlow: '#ffd60a',

  destructive: '#dc2626',        // Solid Darker Red
  destructiveForeground: '#ffffff',
  destructiveSoft: 'rgba(220, 38, 38, 0.16)',
  crimson: '#ff6465',

  // Hairline Borders & Inputs (Resend: Graphite Hairline #292d30)
  border: '#292d30',             // Graphite Hairline 1px border
  borderLight: '#1f2326',
  input: '#0b0e14',              // Dark input surface
  inputBorder: '#292d30',        // 1px hairline border
  inputText: '#ffffff',
  inputPlaceholder: '#6e727a',   // Iron placeholder
  ring: '#9281f7',               // Iris Violet focus ring

  // Special Chrome
  bellIcon: '#f0f0f0',
  badgeNotification: '#ff6465',   // Crimson badge
  badgeNotificationText: '#ffffff',
  avatarBackground: '#3b9eff',
  avatarText: '#ffffff',
  tabBarBackground: '#000000',
  tabBarBorder: '#292d30',
  headerBackground: '#000000',
  headerBorder: '#292d30',

  white: '#ffffff',
  black: '#000000',
  scrim: 'rgba(0, 0, 0, 0.85)',
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

let currentThemeMode = 'light';
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem('plattayam.theme');
    if (saved === 'dark' || saved === 'light') {
      currentThemeMode = saved;
    }
  } catch {}
}

export function setActiveTheme(mode) {
  if (mode === 'dark' || mode === 'light') {
    currentThemeMode = mode;
  }
}

export function getActiveTheme() {
  return themes[currentThemeMode] || lightTheme;
}

export function applyWebTheme(mode) {
  if (typeof document === 'undefined') return;
  const theme = themes[mode] || lightTheme;
  const isDark = theme.isDark;

  // Set attribute on html element
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.backgroundColor = theme.background;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

  if (document.body) {
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.foreground;
  }

  // Inject or update dynamic CSS variables in a dedicated style tag
  let styleEl = document.getElementById('plattayam-theme-vars');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'plattayam-theme-vars';
    document.head.appendChild(styleEl);
  }

  const cssVars = Object.entries(theme)
    .filter(([_, v]) => typeof v === 'string' && (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('rgba')))
    .map(([k, v]) => `  --color-${k}: ${v};`)
    .join('\n');

  styleEl.textContent = `
:root, html, body {
${cssVars}
}
html, body, #root {
  background-color: ${theme.background} !important;
  color: ${theme.foreground};
}
`;
}

// Automatically initialize web theme variables on page load
if (typeof document !== 'undefined') {
  applyWebTheme(currentThemeMode);
}

