import axios from 'axios';
import { Platform } from 'react-native';
import { getActiveOrgId, getAuthToken } from '@/src/lib/secureStore';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

/**
 * Web dev uses Metro's `/api` proxy (see metro.config.js) so requests stay same-origin
 * and avoid browser CORS. Native Expo Go still needs an absolute LAN URL in `.env`.
 */
const baseURL =
  configuredApiUrl && configuredApiUrl.length > 0
    ? configuredApiUrl
    : Platform.OS === 'web'
      ? ''
      : 'http://localhost:5075';

const PUBLIC_AUTH_PATHS = ['/api/auth/request-otp', '/api/auth/verify-otp'];

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  const path = config.url ?? '';
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(
    (publicPath) => path === publicPath || path.endsWith(publicPath),
  );

  if (isPublicAuthRequest) {
    return config;
  }

  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const orgId = await getActiveOrgId();
  if (orgId) {
    config.headers['X-Organization-Id'] = orgId;
  }

  return config;
});
