import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const ACTIVE_ORG_KEY = 'active_org_id';

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthSession(token: string, organizationId: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(ACTIVE_ORG_KEY, organizationId);
}

export async function getActiveOrgId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_ORG_KEY);
}

export async function setActiveOrgId(organizationId: string): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_ORG_KEY, organizationId);
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(ACTIVE_ORG_KEY);
}
