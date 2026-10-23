'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { Navigation } from '@/components/navigation';
import { Boxes, ChevronDown } from 'lucide-react';

const labels: Record<string, string> = {
  '/': 'Overview', '/products': 'Products', '/inventory': 'Inventory', '/categories': 'Categories',
  '/customers': 'Customers', '/suppliers': 'Suppliers', '/sales': 'Sales orders', '/purchases': 'Purchase orders',
  '/payments': 'Payments', '/reports': 'Reports', '/statements': 'Account statements', '/audit': 'Audit history',
  '/settings': 'Company details', '/users': 'Staff accounts', '/roles': 'Roles', '/documents': 'Print document',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const title = labels[pathname] ?? 'Gamma ERP';
  return <AuthGate>
    {isLogin ? children : <div className="min-h-screen bg-[var(--workspace)] md:flex">
      <aside className="hidden w-64 shrink-0 bg-slate-950 text-white md:fixed md:inset-y-0 md:flex md:flex-col md:px-4 md:py-5">
        <Link href="/" className="flex items-center gap-3 px-3"><span className="grid size-10 place-items-center rounded-2xl bg-teal-400 text-slate-950"><Boxes className="size-5"/></span><span><span className="block text-sm font-semibold tracking-wide">GAMMA ERP</span><span className="mt-0.5 block text-[11px] text-slate-400">Business workspace</span></span></Link>
        <Navigation />
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs font-medium text-slate-200">Keep work in sync</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Orders, payments, and stock changes are recorded together.</p></div>
      </aside>
      <div className="min-w-0 flex-1 md:ml-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-teal-500 text-white md:hidden"><Boxes className="size-5"/></span><div><p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground md:hidden">GAMMA ERP</p><h1 className="text-base font-semibold tracking-tight">{title}</h1></div></div><div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex"><span className="size-2 rounded-full bg-emerald-500"/>Workspace ready<ChevronDown className="size-3.5 opacity-50"/></div></div>
          <div className="border-t border-border/60 md:hidden"><Navigation mobile/></div>
        </header>
        <main className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>}
  </AuthGate>;
}
