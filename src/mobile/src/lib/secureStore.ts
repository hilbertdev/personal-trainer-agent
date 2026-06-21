import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const ACTIVE_ORG_KEY = 'active_org_id';

function getWebStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getAuthToken(): Promise<string | null> {
  return getItem(AUTH_TOKEN_KEY);
}

export async function setAuthSession(token: string, organizationId: string): Promise<void> {
  await setItem(AUTH_TOKEN_KEY, token);
  await setItem(ACTIVE_ORG_KEY, organizationId);
}

export async function getActiveOrgId(): Promise<string | null> {
  return getItem(ACTIVE_ORG_KEY);
}

export async function setActiveOrgId(organizationId: string): Promise<void> {
  await setItem(ACTIVE_ORG_KEY, organizationId);
}

export async function clearAuthSession(): Promise<void> {
  await deleteItem(AUTH_TOKEN_KEY);
  await deleteItem(ACTIVE_ORG_KEY);
}
