'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE, AUTH_STORAGE_KEY } from '@/lib/api';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/login') {
      Promise.resolve().then(() => setReady(true));
      return;
    }
    let active = true;
    Promise.resolve().then(() => { if (active) setReady(false); });
    const token = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    const credentials = { credentials: 'include' as RequestCredentials };
    const checkSession = token
      ? fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Basic ${token}` }, ...credentials })
          .then(async (response) => {
            if (!response.ok) return response;
            const migration = await fetch(`${API_BASE}/auth/session`, {
              method: 'POST', headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ rememberDevice: false }), ...credentials,
            });
            if (migration.ok) window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
            return migration.ok ? fetch(`${API_BASE}/auth/me`, credentials) : migration;
          })
      : fetch(`${API_BASE}/auth/me`, credentials);
    checkSession
      .then((response) => {
        if (!active) return;
        if (!response.ok) {
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
          router.replace('/login');
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) {
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
          router.replace('/login');
        }
      });
    return () => { active = false; };
  }, [pathname, router]);

  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Checking sign-in…</div>;
  return <>{children}</>;
}
