import { Alert, Linking, Platform } from 'react-native';

/**
 * Trigger native dialer with a phone number
 */
export function handlePhonePress(phoneNumber) {
  if (!phoneNumber) return;
  const digits = String(phoneNumber).replace(/[^\d+]/g, '');
  if (!digits) return;
  Linking.openURL(`tel:${digits}`).catch((err) => {
    console.warn('Could not open dialer:', err);
  });
}

/**
 * Trigger native mail client with an email address
 */
export function handleEmailPress(email) {
  if (!email) return;
  const trimmed = String(email).trim();
  if (!trimmed) return;
  Linking.openURL(`mailto:${trimmed}`).catch((err) => {
    console.warn('Could not open mail client:', err);
  });
}

/**
 * Handle freeform or structured contact text (phone, email, or combination)
 */
export function handleContactPress(contactText) {
  if (!contactText) return;
  const text = String(contactText).trim();

  // If pure email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    handleEmailPress(text);
    return;
  }

  // If pure phone number
  const digitsOnly = text.replace(/[^\d+]/g, '');
  if (digitsOnly.length >= 7 && !text.includes('@')) {
    handlePhonePress(digitsOnly);
    return;
  }

  // Extract possible email and phone from mixed text
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/);

  if (emailMatch && !phoneMatch) {
    handleEmailPress(emailMatch[0]);
  } else if (phoneMatch && !emailMatch) {
    handlePhonePress(phoneMatch[0]);
  } else if (emailMatch && phoneMatch) {
    Alert.alert('Contact Option', 'Choose how you would like to reach out:', [
      { text: 'Call Phone', onPress: () => handlePhonePress(phoneMatch[0]) },
      { text: 'Send Email', onPress: () => handleEmailPress(emailMatch[0]) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  } else if (text.startsWith('http://') || text.startsWith('https://')) {
    Linking.openURL(text).catch(() => {});
  } else {
    Alert.alert('Contact Details', text);
  }
}
