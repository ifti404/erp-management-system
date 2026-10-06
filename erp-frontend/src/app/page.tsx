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

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your business</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-2 text-3xl font-bold">{products.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Inventory Units</p>
          <p className="mt-2 text-3xl font-bold">{totalInventoryUnits}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="mt-2 text-3xl font-bold">{lowStock.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="mt-2 text-3xl font-bold">{outOfStock.length}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sales Received</p>
          <p className="mt-2 text-3xl font-bold">৳{salesReceived.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Purchases Paid</p>
          <p className="mt-2 text-3xl font-bold">৳{purchasesPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Recent Sales Orders</h2>

        {recentSales.length === 0 ? (
          <p className="text-gray-500">No sales orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentSales.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-3 py-3">#{order.id}</td>

                    <td className="px-3 py-3">{order.customer.name}</td>

                    <td className="px-3 py-3">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>

                    <td className="px-3 py-3">{order.status}</td>

                    <td className="px-3 py-3">
                      ৳{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Purchases */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Recent Purchase Orders</h2>

        {recentPurchases.length === 0 ? (
          <p className="text-gray-500">No purchase orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentPurchases.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-3 py-3">#{order.id}</td>

                    <td className="px-3 py-3">{order.supplier.name}</td>

                    <td className="px-3 py-3">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>

                    <td className="px-3 py-3">{order.status}</td>

                    <td className="px-3 py-3">
                      ৳{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Low Stock Products</h2>

        {lowStock.length === 0 ? (
          <p className="text-gray-500">No low-stock products.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Reorder Level</th>
                </tr>
              </thead>

              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-3">{item.product.sku}</td>

                    <td className="px-3 py-3">{item.product.name}</td>

                    <td className="px-3 py-3">{item.quantity}</td>

                    <td className="px-3 py-3">{item.product.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
