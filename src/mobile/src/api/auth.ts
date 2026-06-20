import { api } from './client';
import type { AuthResponse, Organization } from '@/src/types/auth';

export async function requestOtp(email: string): Promise<void> {
  await api.post('/api/auth/request-otp', { email });
}

export async function verifyOtp(email: string, code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/verify-otp', { email, code });
  return data;
}

export async function listOrganizations(): Promise<Organization[]> {
  const { data } = await api.get<Organization[]>('/api/organizations');
  return data;
}
