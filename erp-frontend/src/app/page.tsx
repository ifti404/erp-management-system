'use client';

import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Boxes, Package, Wallet } from 'lucide-react';

const API = API_BASE;

type Product = {
  id: number;
  sku: string;
  name: string;
  sellingPrice: number;
  reorderLevel: number;
};

type Inventory = {
  id: number;
  product: Product;
  quantity: number;
  updatedAt: string;
};

type SalesOrder = {
  id: number;
  customer: {
    name: string;
  };
  orderDate: string;
  dueDate: string | null;
  status: string;
  totalAmount: number;
};

type PurchaseOrder = {
  id: number;
  supplier: {
    name: string;
  };
  orderDate: string;
  dueDate: string | null;
  status: string;
  totalAmount: number;
};

type Payment = {
  id: number;
  amount: number;
  status: string;
  salesOrder?: {
    id: number;
  };
  purchaseOrder?: {
    id: number;
  };
};

type DashboardData = {
  products: Product[];
  inventory: Inventory[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  payments: Payment[];
  returns: { salesOrderId: number; returnAmount: number }[];
};

export default function Dashboard() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [returns, setReturns] = useState<{ salesOrderId: number; returnAmount: number }[]>([]);

  async function loadDashboard(): Promise<DashboardData> {
      const [
        productsResponse,
        inventoryResponse,
        salesResponse,
        purchaseResponse,
        paymentsResponse,
        returnsResponse,
      ] = await Promise.all([
        apiFetch(`${API}/products`),
        apiFetch(`${API}/inventory`),
        apiFetch(`${API}/sales-orders`),
        apiFetch(`${API}/purchase-orders`),
        apiFetch(`${API}/payments`),
        apiFetch(`${API}/sales-returns`),
      ]);

      if (
        !productsResponse.ok ||
        !inventoryResponse.ok ||
        !salesResponse.ok ||
        !purchaseResponse.ok ||
        !paymentsResponse.ok || !returnsResponse.ok
      ) {
        throw new Error('Failed to load dashboard data');
      }

      const [productsData, inventoryData, salesData, purchaseData, paymentsData, returnsData] =
        await Promise.all([
          productsResponse.json() as Promise<Product[]>,
          inventoryResponse.json() as Promise<Inventory[]>,
          salesResponse.json() as Promise<SalesOrder[]>,
          purchaseResponse.json() as Promise<PurchaseOrder[]>,
          paymentsResponse.json() as Promise<Payment[]>,
          returnsResponse.json() as Promise<{ salesOrderId: number; returnAmount: number }[]>,
        ]);

      return {
        products: productsData,
        inventory: inventoryData,
        salesOrders: salesData,
        purchaseOrders: purchaseData,
        payments: paymentsData,
        returns: returnsData,
      };
  }

  useEffect(() => {
    let active = true;
    loadDashboard().then((data) => {
      if (active) {
        setProducts(data.products);
        setInventory(data.inventory);
        setSalesOrders(data.salesOrders);
        setPurchaseOrders(data.purchaseOrders);
        setPayments(data.payments);
        setReturns(data.returns);
      }
    }).catch((error: unknown) => {
      console.error('Dashboard error:', error);
      if (active) setError('Backend unavailable. Start the ERP server and try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const totalInventoryUnits = inventory.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const lowStock = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.product.reorderLevel,
  );

  const outOfStock = inventory.filter((item) => item.quantity === 0);

  const paidBySales = new Map<number, number>();
  const paidByPurchases = new Map<number, number>();
  for (const payment of payments.filter((item) => item.status === 'PAID' || item.status === 'REFUNDED')) {
    if (payment.salesOrder) paidBySales.set(payment.salesOrder.id, (paidBySales.get(payment.salesOrder.id) ?? 0) + (payment.status === 'PAID' ? 1 : -1) * Number(payment.amount));
    if (payment.purchaseOrder && payment.status === 'PAID') paidByPurchases.set(payment.purchaseOrder.id, (paidByPurchases.get(payment.purchaseOrder.id) ?? 0) + Number(payment.amount));
  }
  const returnBySales = new Map<number, number>();
  for (const entry of returns) returnBySales.set(entry.salesOrderId, (returnBySales.get(entry.salesOrderId) ?? 0) + Number(entry.returnAmount));
  const salesBalance = (order: SalesOrder) => Math.max(0, Number(order.totalAmount) - (returnBySales.get(order.id) ?? 0) - (paidBySales.get(order.id) ?? 0));
  const receivable = salesOrders.filter((order) => !['CANCELLED', 'RETURNED'].includes(order.status)).reduce((sum, order) => sum + salesBalance(order), 0);
  const payable = purchaseOrders.filter((order) => order.status !== 'CANCELLED').reduce((sum, order) => sum + Math.max(0, Number(order.totalAmount) - (paidByPurchases.get(order.id) ?? 0)), 0);
  const currentDate = new Date();
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const overdueCount = [...salesOrders.filter((order) => order.dueDate && order.dueDate < today && !['CANCELLED', 'RETURNED'].includes(order.status) && salesBalance(order) > 0.009), ...purchaseOrders.filter((order) => order.dueDate && order.dueDate < today && order.status !== 'CANCELLED' && Math.max(0, Number(order.totalAmount) - (paidByPurchases.get(order.id) ?? 0)) > 0.009)].length;

  const recentSales = [...salesOrders]
    .sort(
      (a, b) =>
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
    )
    .slice(0, 5);

  const recentPurchases = [...purchaseOrders]
    .sort(
      (a, b) =>
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
    )
    .slice(0, 5);

  const orderStatusClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';

      case 'CANCELLED':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';

      case 'SHIPPED':
      case 'ORDERED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';

      case 'CONFIRMED':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';

      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="page-stack">
      {/* ERROR */}
      {error && (
        <div role="alert" className="alert-error">
          {error}
        </div>
      )}

      {/* PAGE HEADER */}
      <header className="page-heading"><div><p className="eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>Overview</h1><p>Orders, money due, and stock that needs attention.</p></div><div className="flex flex-wrap gap-2"><Link href="/sales" className="button-primary"><ArrowUpRight className="size-4"/>New sale</Link><Link href="/purchases" className="button-secondary"><ArrowDownLeft className="size-4"/>New purchase</Link></div></header>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Products</p><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><Package className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : products.length}</p><p className="mt-1 text-xs text-muted-foreground">Active catalog items</p>
        </div>

        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Units in stock</p><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><Boxes className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : totalInventoryUnits.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Across all products</p>
        </div>

        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Customers owe</p><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ArrowDownLeft className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : `৳${receivable.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`}</p><p className="mt-1 text-xs text-muted-foreground">Open sales balances</p>
        </div>

        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Owed to suppliers</p><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Wallet className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : `৳${payable.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`}</p><p className="mt-1 text-xs text-muted-foreground">Open purchase balances</p>
        </div>

        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Low stock</p><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : lowStock.length}</p><p className="mt-1 text-xs text-muted-foreground">At or below reorder level</p>
        </div>

        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Out of stock</p><span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-700"><Package className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : outOfStock.length}</p><Link href="/inventory" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">Review inventory</Link>
        </div>

        <div className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Overdue balances</p><span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-700"><AlertTriangle className="size-4"/></span></div><p className="mt-3 text-2xl font-semibold">{loading ? '—' : overdueCount}</p><Link href="/statements" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">Review statements</Link>
        </div>
      </div>

      {overdueCount > 0 && <Link href="/statements" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><AlertTriangle className="size-5 shrink-0 text-amber-600"/><span><strong>{overdueCount} overdue account{overdueCount === 1 ? '' : 's'} need follow-up.</strong> Open statements to review balances.</span><span className="ml-auto font-semibold">Review →</span></Link>}

      {/* RECENT SALES */}
      <section className="panel overflow-hidden">
        <div className="panel-heading">
          <div><h2>Recent Sales Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest sales activity
          </p></div>
        </div>

        {recentSales.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No sales orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentSales.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">#{order.id}</td>

                    <td className="px-4 py-3">{order.customer.name}</td>

                    <td className="px-4 py-3">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusClass(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium">
                      ৳{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECENT PURCHASES */}
      <section className="panel overflow-hidden">
        <div className="panel-heading">
          <div><h2>Recent Purchase Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest purchasing activity
          </p></div>
        </div>

        {recentPurchases.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No purchase orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentPurchases.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">#{order.id}</td>

                    <td className="px-4 py-3">{order.supplier.name}</td>

                    <td className="px-4 py-3">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusClass(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium">
                      ৳{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* LOW STOCK */}
      <section className="panel overflow-hidden">
        <div className="panel-heading">
          <div><h2>Low Stock Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Products that need replenishment
          </p></div>
        </div>

        {lowStock.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No low-stock products.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Reorder Level
                  </th>
                </tr>
              </thead>

              <tbody>
                {lowStock.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.product.sku}
                    </td>

                    <td className="px-4 py-3">{item.product.name}</td>

                    <td className="px-4 py-3 font-medium">{item.quantity}</td>

                    <td className="px-4 py-3">{item.product.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
