'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE, apiFetch, AUTH_STORAGE_KEY } from '@/lib/api';
import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { Navigation } from '@/components/navigation';
import { Camera, ChevronDown, Moon, Sun, PanelLeftClose, PanelLeftOpen, UserRound, LogOut, Settings, UserCircle } from 'lucide-react';

const labels: Record<string, string> = {
  '/': 'Overview', '/products': 'Products', '/inventory': 'Inventory', '/categories': 'Categories',
  '/customers': 'Customers', '/suppliers': 'Suppliers', '/sales': 'Sales orders', '/purchases': 'Purchase orders',
  '/payments': 'Payments', '/reports': 'Reports', '/statements': 'Account statements', '/audit': 'Audit history',
  '/expenses': 'Expenses', '/ledger': 'Transaction ledger',
  '/settings': 'Company details', '/users': 'Staff accounts', '/roles': 'Roles', '/documents': 'Print document',
  '/profile': 'Profile', '/user-settings': 'User settings',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [theme, setTheme] = useState<'LIGHT' | 'DARK'>('LIGHT');
  const [profile, setProfile] = useState<{ username: string; fullName: string; email?: string | null; photoData?: string | null; roles: string[] } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';
  const title = labels[pathname] ?? 'Gamma ERP';
  useEffect(() => {
    void Promise.resolve().then(() => setCompact(window.localStorage.getItem('gamma-erp-sidebar-compact') === 'true'));
  }, []);
  useEffect(() => {
    let active = true;
    apiFetch(`${API_BASE}/auth/me`).then((response) => response.ok ? response.json() : null)
      .then((user: { username: string; fullName: string; photoData?: string | null; roles: string[]; themePreference?: string } | null) => {
        if (!active) return;
        if (!user) { setProfile(null); return; }
        setProfile(user);
        const preference = user.themePreference === 'DARK' ? 'DARK' : 'LIGHT';
        setTheme(preference); document.documentElement.classList.toggle('dark', preference === 'DARK');
      }).catch(() => {});
    return () => { active = false; };
  }, [pathname]);
  useEffect(() => {
    const refreshProfile = () => { apiFetch(`${API_BASE}/auth/me`).then((response) => response.ok ? response.json() : null).then((user) => { if (user) setProfile(user); }).catch(() => {}); };
    window.addEventListener('gamma-profile-updated', refreshProfile);
    return () => window.removeEventListener('gamma-profile-updated', refreshProfile);
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
  async function saveProfilePhoto(file?: File) {
    setProfileError('');
    if (file && (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024)) {
      setProfileError('Choose a PNG or JPEG image up to 2 MB.');
      return;
    }
    setPhotoBusy(true);
    try {
      const photoData = file ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this image.'));
        reader.onerror = () => reject(new Error('Could not read this image.'));
        reader.readAsDataURL(file);
      }) : null;
      const response = await apiFetch(`${API_BASE}/auth/profile/photo`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoData }),
      });
      if (!response.ok) throw new Error('Could not save your profile photo.');
      setProfile(await response.json());
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save your profile photo.');
    } finally { setPhotoBusy(false); }
  }
  async function signOut(everywhere = false) {
    if (everywhere && !window.confirm('Sign out this account on every device?')) return;
    try { await apiFetch(`${API_BASE}/auth/${everywhere ? 'revoke-all' : 'logout'}`, { method: 'POST' }); }
    finally { window.sessionStorage.removeItem(AUTH_STORAGE_KEY); router.replace('/login'); }
  }
  return <AuthGate>
    {isLogin ? children : <div className="min-h-screen bg-[var(--workspace)] md:flex">
      <aside onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)} className={`sidebar-desktop hidden shrink-0 bg-slate-950 text-white md:fixed md:inset-y-0 md:flex md:flex-col md:py-5 ${compact && !expanded ? 'sidebar-compact' : 'sidebar-wide'}`}>
        <div className={`flex items-center ${compact && !expanded ? 'flex-col gap-2' : 'justify-between px-4'}`}><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-white p-1"><img src="/gamma-logo.png" alt="Gamma ERP" className="size-full object-contain"/></span>{!(compact && !expanded) && <span><span className="block text-sm font-semibold tracking-wide">GAMMA ERP</span><span className="mt-0.5 block text-[11px] text-slate-400">Business workspace</span></span>}</Link><button type="button" onClick={toggleCompact} title={compact ? 'Keep sidebar expanded' : 'Use compact sidebar'} aria-label={compact ? 'Keep sidebar expanded' : 'Use compact sidebar'} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">{compact ? <PanelLeftOpen className="size-4"/> : <PanelLeftClose className="size-4"/>}</button></div>
        <Navigation compact={compact} expanded={expanded} />
        {!(compact && !expanded) && <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs font-medium text-slate-200">Keep work in sync</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Orders, payments, and stock changes are recorded together.</p></div>}
      </aside>
      <div className={`min-w-0 flex-1 ${compact ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-white p-1 md:hidden"><img src="/gamma-logo.png" alt="Gamma ERP" className="size-full object-contain"/></span><div><p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground md:hidden">GAMMA ERP</p><h1 className="text-base font-semibold tracking-tight">{title}</h1></div></div><div className="flex items-center gap-2"><button type="button" onClick={() => void toggleTheme()} aria-label={`Switch to ${theme === 'DARK' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'DARK' ? 'light' : 'dark'} mode`} className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground">{theme === 'DARK' ? <Sun className="size-4"/> : <Moon className="size-4"/>}</button>{profile && <div className="relative"><button type="button" onClick={() => { setProfileOpen((open) => !open); setProfileError(''); }} aria-expanded={profileOpen} className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-left transition-colors hover:bg-muted"><span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-teal-100 text-xs font-semibold text-teal-900">{profile.photoData ? <img src={profile.photoData} alt="" className="size-full object-cover"/> : <span>{(profile.fullName || profile.username).slice(0, 1).toUpperCase()}</span>}</span><span className="hidden max-w-36 sm:block"><span className="block truncate text-xs font-semibold text-foreground">{profile.fullName || profile.username}</span><span className="block text-[10px] text-muted-foreground">{(profile.roles?.[0] ?? 'Staff').replace(/^ROLE_/, '')}</span></span><ChevronDown className="size-3.5 text-muted-foreground"/></button>{profileOpen && <section className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl"><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-teal-100 text-sm font-semibold text-teal-900">{profile.photoData ? <img src={profile.photoData} alt="Profile" className="size-full object-cover"/> : <UserRound className="size-5"/>}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{profile.fullName}</p><p className="truncate text-xs text-muted-foreground">@{profile.username} · {(profile.roles?.[0] ?? 'Staff').replace(/^ROLE_/, '')}</p></div></div><label className="button-secondary mt-4 w-full cursor-pointer"><Camera className="size-4"/>{photoBusy ? 'Saving…' : 'Upload profile photo'}<input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={photoBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void saveProfilePhoto(file); event.currentTarget.value = ''; }}/></label>{profile.photoData && <button type="button" disabled={photoBusy} onClick={() => void saveProfilePhoto()} className="mt-2 w-full rounded-lg py-2 text-xs text-muted-foreground hover:bg-muted">Remove photo</button>}{profileError && <p role="alert" className="mt-3 text-xs text-destructive">{profileError}</p>}<div className="mt-3 grid gap-1 border-t border-border pt-3"><Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"><UserCircle className="size-4"/>Show profile</Link><Link href="/user-settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"><Settings className="size-4"/>User settings</Link><button type="button" onClick={() => void signOut()} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/5"><LogOut className="size-4"/>Sign out</button><button type="button" onClick={() => void signOut(true)} className="rounded-lg px-2.5 py-2 text-left text-xs text-muted-foreground hover:bg-muted">Sign out everywhere</button></div></section>}</div>}</div></div>
          <div className="mobile-nav border-t border-border/60 md:hidden"><Navigation mobile/></div>
        </header>
        <main className="app-main min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>}
  </AuthGate>;
}
