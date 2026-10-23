export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api').replace(/\/$/, '');

export const AUTH_STORAGE_KEY = 'gamma-erp-session';

function readCsrfCookie() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((entry) => entry.startsWith('XSRF-TOKEN='))?.slice('XSRF-TOKEN='.length) ?? '';
}

export async function fetchWithCsrf(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    let token = readCsrfCookie();
    if (!token) {
      const response = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
      if (!response.ok) throw new Error('Could not start a secure request. Refresh the page and try again.');
      const body = await response.json() as { token?: string };
      token = readCsrfCookie() || body.token || '';
    }
    if (!token) throw new Error('Secure request token is missing. Refresh the page and try again.');
    headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
  }
  return fetch(input, { ...init, credentials: 'include', headers });
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (headers.has('Authorization')) headers.delete('Authorization');
  return fetchWithCsrf(input, { ...init, headers });
}
