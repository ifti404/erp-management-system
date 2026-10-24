'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE, apiFetch, AUTH_STORAGE_KEY } from '@/lib/api';
import { Activity, Boxes, ClipboardList, CreditCard, LayoutDashboard, LogOut, Package, Settings2, ShieldCheck, Tags, Truck, Users, Wallet, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navigation: { name: string; href: string; icon: LucideIcon; group: string; admin?: boolean; permission?: string }[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard, group: 'WORKSPACE' },
  { name: 'Products', href: '/products', icon: Package, group: 'CATALOG' },
  { name: 'Inventory', href: '/inventory', icon: Boxes, group: 'CATALOG' },
  { name: 'Categories', href: '/categories', icon: Tags, group: 'CATALOG', permission: 'CATEGORIES_VIEW' },
  { name: 'Customers', href: '/customers', icon: Users, group: 'PARTNERS', permission: 'CUSTOMERS_VIEW' },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, group: 'PARTNERS', permission: 'SUPPLIERS_VIEW' },
  { name: 'Sales orders', href: '/sales', icon: ClipboardList, group: 'OPERATIONS', permission: 'SALES_VIEW' },
  { name: 'Returns', href: '/returns', icon: ClipboardList, group: 'OPERATIONS', permission: 'RETURNS_VIEW' },
  { name: 'Purchase orders', href: '/purchases', icon: ClipboardList, group: 'OPERATIONS', permission: 'PURCHASES_VIEW' },
  { name: 'Payments', href: '/payments', icon: CreditCard, group: 'OPERATIONS', permission: 'PAYMENTS_VIEW' },
  { name: 'Expenses', href: '/expenses', icon: Receipt, group: 'FINANCE', permission: 'EXPENSES_VIEW' },
  { name: 'Reports', href: '/reports', icon: Activity, group: 'FINANCE', permission: 'REPORTS_VIEW' },
  { name: 'Statements', href: '/statements', icon: Wallet, group: 'FINANCE', permission: 'STATEMENTS_VIEW' },
  { name: 'Audit history', href: '/audit', icon: ShieldCheck, group: 'ADMIN', admin: true },
  { name: 'Company details', href: '/settings', icon: Settings2, group: 'ADMIN', permission: 'SETTINGS_VIEW' },
  { name: 'Staff accounts', href: '/users', icon: Users, group: 'ADMIN', admin: true },
  { name: 'Roles', href: '/roles', icon: ShieldCheck, group: 'ADMIN', admin: true },
];

export function Navigation({ mobile = false, compact = false, expanded = false }: { mobile?: boolean; compact?: boolean; expanded?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    apiFetch(`${API_BASE}/auth/me`).then((r) => r.ok ? r.json() : null)
      .then((user: { roles?: string[]; permissions?: string[] } | null) => { if (active) { setIsAdmin(Boolean(user?.roles?.includes('ROLE_ADMIN'))); setPermissions(user?.permissions ?? []); } })
      .catch(() => { if (active) setIsAdmin(false); });
    return () => { active = false; };
  }, []);

  async function signOut(all = false) {
    if (all && !window.confirm('Sign out this account on every device?')) return;
    try { await apiFetch(`${API_BASE}/auth/${all ? 'revoke-all' : 'logout'}`, { method: 'POST' }); }
    finally { window.sessionStorage.removeItem(AUTH_STORAGE_KEY); router.replace('/login'); }
  }

  const visible = navigation.filter((item) => item.admin ? isAdmin : !item.permission || isAdmin || permissions.includes(item.permission));
  const activeFor = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  if (mobile) return <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-2 pt-1">
    {visible.map(({ name, href, icon: Icon }) => <Link key={href} href={href} aria-current={activeFor(href) ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-colors ${activeFor(href) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-4" aria-hidden="true"/>{name}</Link>)}
    <button type="button" onClick={() => void signOut()} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive"><LogOut className="size-4"/>Sign out</button>
  </nav>;

  const groups = [...new Set(visible.map((item) => item.group))];
  const iconOnly = compact && !expanded;
  return <nav aria-label="Main navigation" className={`mt-7 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto ${iconOnly ? 'items-center px-2' : 'px-4'} pr-1`}>
    {groups.map((group) => <div key={group} className={`space-y-1 ${iconOnly ? 'w-full' : ''}`}>{!iconOnly && <p className="px-3 text-[10px] font-semibold tracking-[0.16em] text-slate-400">{group}</p>}{visible.filter((item) => item.group === group).map(({ name, href, icon: Icon }) => <Link key={href} href={href} aria-label={name} title={iconOnly ? name : undefined} aria-current={activeFor(href) ? 'page' : undefined} className={`group flex items-center gap-3 rounded-xl py-2.5 text-sm transition-colors ${iconOnly ? 'justify-center px-0' : 'px-3'} ${activeFor(href) ? 'bg-white/10 font-semibold text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon className={`size-4 shrink-0 ${activeFor(href) ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'}`} aria-hidden="true"/>{!iconOnly && <span>{name}</span>}{!iconOnly && activeFor(href) && <span className="ml-auto size-1.5 rounded-full bg-teal-300"/>}</Link>)}</div>)}
    <div className={`mt-auto border-t border-white/10 pt-4 ${iconOnly ? 'w-full' : ''}`}><button type="button" aria-label="Sign out" title={iconOnly ? 'Sign out' : undefined} onClick={() => void signOut()} className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white ${iconOnly ? 'justify-center px-0' : 'px-3'}`}><LogOut className="size-4"/>{!iconOnly && 'Sign out'}</button>{!iconOnly && <button type="button" onClick={() => void signOut(true)} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-red-300">Sign out everywhere</button>}</div>
  </nav>;
}
