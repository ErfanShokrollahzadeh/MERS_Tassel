import { api, ApiError } from '@/lib/apiClient';
import type { AuthSession, AuthUser } from '@/types/commerce';

export { ApiError };

export function signup(payload: { email: string; firstName: string; lastName: string; password: string }) {
  return api.post<AuthSession>('/auth/register', payload);
}

export function login(payload: { email: string; password: string }) {
  return api.post<AuthSession>('/auth/login', payload);
}

export function forgotPassword(payload: { email: string }) {
  return api.post<null>('/auth/forgot-password', payload);
}

export function resetPassword(payload: { email: string; token: string; newPassword: string }) {
  return api.post<null>('/auth/reset-password', payload);
}

export function refreshSession(refresh: string) {
  return api.post<AuthSession>('/auth/refresh', { refresh });
}

export function profile() {
  return api.get<AuthUser>('/auth/profile', { auth: true });
}

export function updateProfile(payload: { firstName: string; lastName: string }) {
  return api.put<AuthUser>('/auth/profile', payload, { auth: true });
}

export function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return api.post<null>('/auth/change-password', payload, { auth: true });
}

export function logout(refresh: string) {
  return api.post<null>('/auth/logout', { refresh }, { auth: true });
}
