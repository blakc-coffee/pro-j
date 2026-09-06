import { Platform } from 'react-native';

const fontFamily = Platform.OS === 'web'
  ? 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  : undefined;

export const typography = {
  title: {
    fontFamily,
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 40,
  },
  subtitle: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  heading: {
    fontFamily,
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 32,
  },
  subheading: {
    fontFamily,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
  },
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  label: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
};
