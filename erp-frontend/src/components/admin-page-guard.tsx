'use client';

import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

type Access = 'checking' | 'allowed' | 'denied' | 'error';

export function AdminPageGuard({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<Access>('checking');

  useEffect(() => {
    let active = true;
    apiFetch(`${API_BASE}/auth/me`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not verify admin access.');
        const user = await response.json() as { roles?: string[] };
        if (active) setAccess(user.roles?.includes('ROLE_ADMIN') ? 'allowed' : 'denied');
      })
      .catch(() => { if (active) setAccess('error'); });
    return () => { active = false; };
  }, []);

  if (access === 'checking') return <p className="p-6 text-sm text-muted-foreground">Checking administrator access…</p>;
  if (access === 'denied') return <div role="alert" className="rounded-lg border p-6"><h1 className="text-xl font-semibold">Administrator access required</h1><p className="mt-2 text-sm text-muted-foreground">Ask an administrator to manage staff and setup records.</p></div>;
  if (access === 'error') return <p role="alert" className="rounded-lg border border-destructive/30 p-6 text-sm text-destructive">Could not verify your access. Refresh the page or sign in again.</p>;
  return <>{children}</>;
}
