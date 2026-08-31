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

function currentLang(): string {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'id' || urlLang === 'in') return 'id';
    if (urlLang === 'en') return 'en';
    return localStorage.getItem('site_lang') || 'en';
  } catch {
    return 'en';
  }
}

function csrfToken(): string {
  try {
    return document.cookie.replace(/(?:(?:^|.*;\s*)csrf_token\s*\=\s*([^;]*).*$)|^.*$/, '$1');
  } catch {
    return '';
  }
}

interface ApiOptions extends RequestInit {
  auth?: boolean;
  skipCSRF?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { auth, skipCSRF, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) || {}),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (!skipCSRF) {
    const token = csrfToken();
    if (token) finalHeaders['X-CSRF-Token'] = token;
  }

  const res = await fetch(`/api${path}?lang=${currentLang()}`, { ...rest, headers: finalHeaders });

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

export async function apiData<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await api<{ success: boolean; data: T }>(path, opts);
  return res.data;
}
