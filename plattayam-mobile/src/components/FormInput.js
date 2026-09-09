import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../constants/colors';
import { radius, spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry,
  editable = true,
  keyboardType,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  style,
  multiline,
  numberOfLines,
  rightElement,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          isFocused && styles.focused,
          !!error && styles.inputError,
          !editable && styles.disabled,
          style,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder || colors.mutedForeground}
          secureTextEntry={secureTextEntry}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.multilineInput]}
          {...rest}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  multilineWrapper: {
    minHeight: 80,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  focused: {
    borderColor: colors.ring,
    backgroundColor: colors.card,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.surfaceAlt,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8,
  },
  multilineInput: {
    paddingVertical: 0,
  },
  rightElement: {
    marginLeft: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.destructive,
    marginTop: 4,
  },
  helperText: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: 4,
  },
});
