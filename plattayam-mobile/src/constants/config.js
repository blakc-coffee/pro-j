import Constants from 'expo-constants';

/**
 * The FastAPI backend currently hardcodes this user on every protected-looking route.
 * The mobile app must use the same id until the backend exposes a real current-user API.
 */
export const CURRENT_USER_ID = 1;

export const API_PORT = 8000;

function hostFromExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    return null;
  }

  return host;
}

export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  const host = hostFromExpo();
  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  return `http://127.0.0.1:${API_PORT}`;
}
