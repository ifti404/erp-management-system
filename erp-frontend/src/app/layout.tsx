import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gamma ERP',
  description: 'Business ERP Management System',
};

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Customers', href: '/customers' },
  { name: 'Suppliers', href: '/suppliers' },
  { name: 'Purchases', href: '/purchases' },
  { name: 'Sales', href: '/sales' },
  { name: 'Payments', href: '/payments' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 border-r bg-muted/20">
            <div className="flex h-full flex-col px-4 py-6">
              {/* Brand */}
              <div className="px-3">
                <h1 className="text-lg font-semibold tracking-tight">
                  Gamma ERP
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Business Management
                </p>
              </div>

              {/* Navigation */}
              <nav className="mt-8 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      item.href === '/'
                        ? 'bg-muted font-medium'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Footer */}
              <div className="mt-auto px-3 pt-6">
                <p className="text-xs text-muted-foreground">Gamma Gadgets</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  ERP System
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
