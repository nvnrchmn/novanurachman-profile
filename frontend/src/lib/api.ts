const TOKEN_KEY = 'nova_admin_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

interface ApiOptions extends RequestInit {
  auth?: boolean;
}

/**
 * Thin fetch wrapper. Throws on non-2xx so callers can surface the server's
 * own message instead of a generic failure.
 */
export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { auth, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) || {}),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, { ...rest, headers: finalHeaders });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearToken();
    }
    throw new Error(body?.message || `Request gagal (${res.status})`);
  }

  return body as T;
}

/** Unwraps the `{ success, data }` envelope the backend returns. */
export async function apiData<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await api<{ success: boolean; data: T }>(path, opts);
  return res.data;
}
