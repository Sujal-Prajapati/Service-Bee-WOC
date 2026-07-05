const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

type AuthRole = 'user' | 'company';

function getToken(role: AuthRole) {
  return role === 'user'
    ? localStorage.getItem('userToken')
    : localStorage.getItem('companyToken');
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function saveAuth(role: AuthRole, token: string, profile?: Record<string, unknown>) {
  localStorage.setItem(role === 'user' ? 'userToken' : 'companyToken', token);
  const decoded = decodeJwtPayload(token);
  if (decoded?.id) {
    localStorage.setItem(role === 'user' ? 'userId' : 'companyId', decoded.id);
  }
  if (profile?.name) {
    localStorage.setItem(role === 'user' ? 'userName' : 'companyName', String(profile.name));
  }
  if (profile?.email) {
    localStorage.setItem(role === 'user' ? 'userEmail' : 'companyEmail', String(profile.email));
  }
}

export function clearAuth(role: AuthRole) {
  if (role === 'user') {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAuth');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
  } else {
    localStorage.removeItem('companyToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyAuth');
    localStorage.removeItem('companyEmail');
    localStorage.removeItem('companyName');
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, role: AuthRole = 'user'): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken(role);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to home
    if (response.status === 401) {
      clearAuth(role);
      window.location.href = '/';
      throw new Error('Session expired. Please login again.');
    }

    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : typeof payload === 'string'
          ? payload
          : 'Request failed';
    throw new Error(message);
  }

  return (payload as T) ?? ({} as T);
}
