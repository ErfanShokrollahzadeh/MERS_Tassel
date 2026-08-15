const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  role: 'customer' | 'staff' | 'admin';
};

export type AuthSession = { access: string; refresh: string; user: AuthUser };

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}, access?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...init.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const firstField = Object.values(record).find((value) => Array.isArray(value) || typeof value === 'string');
    const message = typeof record.detail === 'string'
      ? record.detail
      : Array.isArray(firstField)
        ? String(firstField[0])
        : typeof firstField === 'string' ? firstField : 'The request could not be completed.';
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}

export function signup(payload: { email: string; first_name: string; last_name: string; password: string }) {
  return request<AuthSession>('/accounts/register/', { method: 'POST', body: JSON.stringify(payload) });
}

export function login(payload: { email: string; password: string }) {
  return request<AuthSession>('/accounts/login/', { method: 'POST', body: JSON.stringify(payload) });
}

export function refreshSession(refresh: string) {
  return request<{ access: string; refresh?: string }>('/accounts/token/refresh/', { method: 'POST', body: JSON.stringify({ refresh }) });
}

export function profile(access: string) {
  return request<AuthUser>('/accounts/profile/', {}, access);
}

export function logout(access: string, refresh: string) {
  return request<null>('/accounts/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }, access);
}
