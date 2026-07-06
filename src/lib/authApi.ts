import type { AuthUser } from '../types';
import { SessionExpiredError } from './dataApi';

interface LoginResponse {
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' &&
      data &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Request failed';

    throw new Error(errorMessage);
  }

  return data as T;
}

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJson<LoginResponse>(response);
  return data.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  const data = await parseJson<MeResponse>(response);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
  });
}
