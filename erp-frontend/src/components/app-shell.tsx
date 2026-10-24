'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { Navigation } from '@/components/navigation';
import { Boxes, ChevronDown, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const labels: Record<string, string> = {
  '/': 'Overview', '/products': 'Products', '/inventory': 'Inventory', '/categories': 'Categories',
  '/customers': 'Customers', '/suppliers': 'Suppliers', '/sales': 'Sales orders', '/purchases': 'Purchase orders',
  '/payments': 'Payments', '/reports': 'Reports', '/statements': 'Account statements', '/audit': 'Audit history',
  '/expenses': 'Expenses',
  '/settings': 'Company details', '/users': 'Staff accounts', '/roles': 'Roles', '/documents': 'Print document',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [theme, setTheme] = useState<'LIGHT' | 'DARK'>('LIGHT');
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const title = labels[pathname] ?? 'Gamma ERP';
  useEffect(() => {
    void Promise.resolve().then(() => setCompact(window.localStorage.getItem('gamma-erp-sidebar-compact') === 'true'));
    let active = true;
    apiFetch(`${API_BASE}/auth/me`).then((response) => response.ok ? response.json() : null)
      .then((user: { themePreference?: string } | null) => {
        if (!active || !user) return;
        const preference = user.themePreference === 'DARK' ? 'DARK' : 'LIGHT';
        setTheme(preference); document.documentElement.classList.toggle('dark', preference === 'DARK');
      }).catch(() => {});
    return () => { active = false; };
  }, []);
  const toggleCompact = () => setCompact((value) => { window.localStorage.setItem('gamma-erp-sidebar-compact', String(!value)); return !value; });
  async function toggleTheme() {
    const next = theme === 'DARK' ? 'LIGHT' : 'DARK';
    setTheme(next); document.documentElement.classList.toggle('dark', next === 'DARK');
    try {
      const response = await apiFetch(`${API_BASE}/auth/preferences/theme`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ themePreference: next }) });
      if (!response.ok) throw new Error('Theme preference was not saved');
    } catch {
      setTheme(theme); document.documentElement.classList.toggle('dark', theme === 'DARK');
    }
  }
  return <AuthGate>
    {isLogin ? children : <div className="min-h-screen bg-[var(--workspace)] md:flex">
      <aside onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)} className={`sidebar-desktop hidden shrink-0 bg-slate-950 text-white md:fixed md:inset-y-0 md:flex md:flex-col md:py-5 ${compact && !expanded ? 'sidebar-compact' : 'sidebar-wide'}`}>
        <div className={`flex items-center ${compact && !expanded ? 'flex-col gap-2' : 'justify-between px-4'}`}><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-teal-400 text-slate-950"><Boxes className="size-5"/></span>{!(compact && !expanded) && <span><span className="block text-sm font-semibold tracking-wide">GAMMA ERP</span><span className="mt-0.5 block text-[11px] text-slate-400">Business workspace</span></span>}</Link><button type="button" onClick={toggleCompact} title={compact ? 'Keep sidebar expanded' : 'Use compact sidebar'} aria-label={compact ? 'Keep sidebar expanded' : 'Use compact sidebar'} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">{compact ? <PanelLeftOpen className="size-4"/> : <PanelLeftClose className="size-4"/>}</button></div>
        <Navigation compact={compact} expanded={expanded} />
        {!(compact && !expanded) && <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs font-medium text-slate-200">Keep work in sync</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Orders, payments, and stock changes are recorded together.</p></div>}
      </aside>
      <div className={`min-w-0 flex-1 ${compact ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-500 text-white md:hidden"><Boxes className="size-5"/></span><div><p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground md:hidden">GAMMA ERP</p><h1 className="text-base font-semibold tracking-tight">{title}</h1></div></div><div className="flex items-center gap-2"><button type="button" onClick={() => void toggleTheme()} aria-label={`Switch to ${theme === 'DARK' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'DARK' ? 'light' : 'dark'} mode`} className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground">{theme === 'DARK' ? <Sun className="size-4"/> : <Moon className="size-4"/>}</button><div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex"><span className="size-2 rounded-full bg-emerald-500"/>Workspace ready<ChevronDown className="size-3.5 opacity-50"/></div></div></div>
          <div className="mobile-nav border-t border-border/60 md:hidden"><Navigation mobile/></div>
        </header>
        <main className="app-main min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>}
  </AuthGate>;
}
