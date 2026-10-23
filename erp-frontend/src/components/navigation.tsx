'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE, apiFetch, AUTH_STORAGE_KEY } from '@/lib/api';
import { Activity, Boxes, ClipboardList, CreditCard, LayoutDashboard, LogOut, Package, Settings2, ShieldCheck, Tags, Truck, Users, Wallet } from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard, group: 'WORKSPACE' },
  { name: 'Products', href: '/products', icon: Package, group: 'CATALOG' },
  { name: 'Inventory', href: '/inventory', icon: Boxes, group: 'CATALOG' },
  { name: 'Categories', href: '/categories', icon: Tags, group: 'CATALOG', admin: true },
  { name: 'Customers', href: '/customers', icon: Users, group: 'PARTNERS' },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, group: 'PARTNERS' },
  { name: 'Sales orders', href: '/sales', icon: ClipboardList, group: 'OPERATIONS' },
  { name: 'Returns', href: '/returns', icon: ClipboardList, group: 'OPERATIONS' },
  { name: 'Purchase orders', href: '/purchases', icon: ClipboardList, group: 'OPERATIONS' },
  { name: 'Payments', href: '/payments', icon: CreditCard, group: 'OPERATIONS' },
  { name: 'Reports', href: '/reports', icon: Activity, group: 'FINANCE' },
  { name: 'Statements', href: '/statements', icon: Wallet, group: 'FINANCE' },
  { name: 'Audit history', href: '/audit', icon: ShieldCheck, group: 'ADMIN', admin: true },
  { name: 'Company details', href: '/settings', icon: Settings2, group: 'ADMIN', admin: true },
  { name: 'Staff accounts', href: '/users', icon: Users, group: 'ADMIN', admin: true },
  { name: 'Roles', href: '/roles', icon: ShieldCheck, group: 'ADMIN', admin: true },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    apiFetch(`${API_BASE}/auth/me`).then((r) => r.ok ? r.json() : null)
      .then((user: { roles?: string[] } | null) => { if (active) setIsAdmin(Boolean(user?.roles?.includes('ROLE_ADMIN'))); })
      .catch(() => { if (active) setIsAdmin(false); });
    return () => { active = false; };
  }, []);

  async function signOut(all = false) {
    if (all && !window.confirm('Sign out this account on every device?')) return;
    try { await apiFetch(`${API_BASE}/auth/${all ? 'revoke-all' : 'logout'}`, { method: 'POST' }); }
    finally { window.sessionStorage.removeItem(AUTH_STORAGE_KEY); router.replace('/login'); }
  }

  const visible = navigation.filter((item) => !item.admin || isAdmin);
  const activeFor = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  if (mobile) return <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-2 pt-1">
    {visible.map(({ name, href, icon: Icon }) => <Link key={href} href={href} aria-current={activeFor(href) ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-colors ${activeFor(href) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-4" aria-hidden="true"/>{name}</Link>)}
    <button type="button" onClick={() => void signOut()} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive"><LogOut className="size-4"/>Sign out</button>
  </nav>;

  const groups = [...new Set(visible.map((item) => item.group))];
  return <nav aria-label="Main navigation" className="mt-7 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
    {groups.map((group) => <div key={group} className="space-y-1"><p className="px-3 text-[10px] font-semibold tracking-[0.16em] text-slate-400">{group}</p>{visible.filter((item) => item.group === group).map(({ name, href, icon: Icon }) => <Link key={href} href={href} aria-current={activeFor(href) ? 'page' : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${activeFor(href) ? 'bg-white/10 font-semibold text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon className={`size-4 ${activeFor(href) ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'}`} aria-hidden="true"/><span>{name}</span>{activeFor(href) && <span className="ml-auto size-1.5 rounded-full bg-teal-300"/>}</Link>)}</div>)}
    <div className="mt-auto border-t border-white/10 pt-4"><button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"><LogOut className="size-4"/>Sign out</button><button type="button" onClick={() => void signOut(true)} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-red-300">Sign out everywhere</button></div>
  </nav>;
}
