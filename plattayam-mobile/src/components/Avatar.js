import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  let clean = name.trim();
  if (!clean) return '??';

  // Strip leading roll number if present (e.g. "2025BCS0147 DHARUN KARTHIKEYAN")
  const rollMatch = clean.match(/^[0-9a-zA-Z]{8,12}\s+(.+)$/i);
  if (rollMatch) {
    clean = rollMatch[1].trim();
  }

  // If the whole string is only numbers or empty, return '??' (never derive from roll number)
  if (/^[0-9]+$/i.test(clean) || clean.length === 0) {
    return '??';
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  // For 2 or more words: first character of first name + first character of last name (ignoring middle names)
  const first = parts[0][0] || '';
  const second = parts[1][0] || '';
  const result = (first + second).toUpperCase();
  return result || '??';
}

export default function Avatar({ name, size = 44, style }) {
  const initials = getInitials(name);
  const radiusVal = size / 2;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radiusVal,
        },
        style,
      ]}
      accessibilityLabel={`Avatar for ${name || 'User'}`}
    >
      <Text style={[styles.text, { fontSize: Math.max(12, Math.floor(size * 0.36)) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#eee9e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: 0.5,
  },
});
