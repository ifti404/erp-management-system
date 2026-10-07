'use client';

import { useEffect, useState } from 'react';

const API = 'http://localhost:8080/api';

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
  status: string;
  totalAmount: number;
};

type PurchaseOrder = {
  id: number;
  supplier: {
    name: string;
  };
  orderDate: string;
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

export default function Dashboard() {
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setError('');

      const [
        productsResponse,
        inventoryResponse,
        salesResponse,
        purchaseResponse,
        paymentsResponse,
      ] = await Promise.all([
        fetch(`${API}/products`),
        fetch(`${API}/inventory`),
        fetch(`${API}/sales-orders`),
        fetch(`${API}/purchase-orders`),
        fetch(`${API}/payments`),
      ]);

      if (
        !productsResponse.ok ||
        !inventoryResponse.ok ||
        !salesResponse.ok ||
        !purchaseResponse.ok ||
        !paymentsResponse.ok
      ) {
        throw new Error('Failed to load dashboard data');
      }

      setProducts(await productsResponse.json());
      setInventory(await inventoryResponse.json());
      setSalesOrders(await salesResponse.json());
      setPurchaseOrders(await purchaseResponse.json());
      setPayments(await paymentsResponse.json());
    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Backend unavailable. Start the ERP server and try again.');
    }
  }

  const totalInventoryUnits = inventory.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const lowStock = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.product.reorderLevel,
  );

  const outOfStock = inventory.filter((item) => item.quantity === 0);

  const salesReceived = payments
    .filter((payment) => payment.status === 'PAID' && payment.salesOrder)
    .reduce((total, payment) => total + payment.amount, 0);

  const purchasesPaid = payments
    .filter((payment) => payment.status === 'PAID' && payment.purchaseOrder)
    .reduce((total, payment) => total + payment.amount, 0);

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
    <div className="space-y-8">
      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your business</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="mt-2 text-3xl font-bold">{products.length}</p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Inventory Units</p>
          <p className="mt-2 text-3xl font-bold">{totalInventoryUnits}</p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="mt-2 text-3xl font-bold">{lowStock.length}</p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="mt-2 text-3xl font-bold">{outOfStock.length}</p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Sales Received</p>
          <p className="mt-2 text-3xl font-bold">৳{salesReceived.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Purchases Paid</p>
          <p className="mt-2 text-3xl font-bold">৳{purchasesPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* RECENT SALES */}
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Recent Sales Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest sales activity
          </p>
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
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Recent Purchase Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest purchasing activity
          </p>
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
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Low Stock Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Products that need replenishment
          </p>
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
