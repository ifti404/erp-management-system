'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE, AUTH_STORAGE_KEY } from '@/lib/api';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

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
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
          router.replace('/login');
          return;
        }
        const user = await response.json() as { roles?: string[]; permissions?: string[] };
        const isAdmin = user.roles?.includes('ROLE_ADMIN') ?? false;
        const routePermission: Record<string, string | string[]> = {
          '/products': 'PRODUCTS_VIEW', '/inventory': 'INVENTORY_VIEW', '/categories': 'CATEGORIES_VIEW',
          '/customers': 'CUSTOMERS_VIEW', '/suppliers': 'SUPPLIERS_VIEW', '/sales': 'SALES_VIEW',
          '/returns': 'RETURNS_VIEW', '/purchases': 'PURCHASES_VIEW', '/payments': 'PAYMENTS_VIEW',
          '/expenses': 'EXPENSES_VIEW', '/accounts': ['ACCOUNTS_VIEW', 'PAYMENTS_VIEW', 'EXPENSES_VIEW', 'REPORTS_VIEW'], '/reports': 'REPORTS_VIEW', '/statements': 'STATEMENTS_VIEW', '/ledger': 'REPORTS_VIEW',
          '/settings': 'SETTINGS_VIEW', '/audit': 'ROLE_ADMIN', '/users': 'ROLE_ADMIN', '/roles': 'ROLE_ADMIN',
          '/documents': ['SALES_VIEW', 'PURCHASES_VIEW', 'PAYMENTS_VIEW'],
        };
        const required = routePermission[pathname];
        const granted = !required || isAdmin || (Array.isArray(required)
          ? required.some((permission) => user.permissions?.includes(permission))
          : required === 'ROLE_ADMIN' ? isAdmin : user.permissions?.includes(required));
        setDenied(!granted);
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
  if (denied && pathname !== '/login') return <div role="alert" className="m-6 rounded-xl border border-border bg-card p-6"><h1 className="text-lg font-semibold">Access not available</h1><p className="mt-2 text-sm text-muted-foreground">Your role does not have permission to view this section. Ask an administrator to update your role access.</p></div>;
  return <>{children}</>;
}
