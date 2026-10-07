'use client';

import { useEffect, useState } from 'react';

const API = 'http://localhost:8080/api';

type Customer = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  sku: string;
  name: string;
  sellingPrice: number;
};

type SalesOrder = {
  id: number;
  customer: Customer;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes: string;
};

type SalesItem = {
  id: number;
  salesOrder: SalesOrder;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [items, setItems] = useState<SalesItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');

  const [itemOrderId, setItemOrderId] = useState('');
  const [itemProductId, setItemProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const fetchData = async () => {
    const [ordersResponse, itemsResponse, customersResponse, productsResponse] =
      await Promise.all([
        fetch(`${API}/sales-orders`),
        fetch(`${API}/sales-items`),
        fetch(`${API}/customers`),
        fetch(`${API}/products`),
      ]);

    const [ordersData, itemsData, customersData, productsData] =
      await Promise.all([
        ordersResponse.json(),
        itemsResponse.json(),
        customersResponse.json(),
        productsResponse.json(),
      ]);

    setOrders(ordersData);
    setItems(itemsData);
    setCustomers(customersData);
    setProducts(productsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetOrderForm = () => {
    setCustomerId('');
    setOrderDate('');
    setStatus('PENDING');
    setNotes('');
    setEditingOrderId(null);
  };

  const resetItemForm = () => {
    setItemOrderId('');
    setItemProductId('');
    setQuantity('');
    setUnitPrice('');
    setEditingItemId(null);
  };

  const handleProductChange = (value: string) => {
    setItemProductId(value);

    const product = products.find((p) => p.id === Number(value));

    if (product) {
      setUnitPrice(String(product.sellingPrice));
    } else {
      setUnitPrice('');
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderData = {
      customer: {
        id: Number(customerId),
      },
      orderDate,
      status,
      notes,
    };

    const url = editingOrderId
      ? `${API}/sales-orders/${editingOrderId}`
      : `${API}/sales-orders`;

    const method = editingOrderId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'Failed to save sales order');
      return;
    }

    resetOrderForm();
    await fetchData();
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      salesOrder: {
        id: Number(itemOrderId),
      },
      product: {
        id: Number(itemProductId),
      },
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
    };

    const url = editingItemId
      ? `${API}/sales-items/${editingItemId}`
      : `${API}/sales-items`;

    const method = editingItemId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'Failed to save sales item');
      return;
    }

    resetItemForm();
    await fetchData();
  };

  const editOrder = (order: SalesOrder) => {
    setEditingOrderId(order.id);
    setCustomerId(String(order.customer.id));
    setOrderDate(order.orderDate.slice(0, 16));
    setStatus(order.status);
    setNotes(order.notes || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const editItem = (item: SalesItem) => {
    setEditingItemId(item.id);
    setItemOrderId(String(item.salesOrder.id));
    setItemProductId(String(item.product.id));
    setQuantity(String(item.quantity));
    setUnitPrice(String(item.unitPrice));

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deleteOrder = async (id: number) => {
    if (!confirm('Delete this sales order?')) {
      return;
    }

    const response = await fetch(`${API}/sales-orders/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      alert('Cannot delete this order. It may have sales items or payments.');
      return;
    }

    await fetchData();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this sales item?')) {
      return;
    }

    const response = await fetch(`${API}/sales-items/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'Failed to delete sales item');
      return;
    }

    await fetchData();
  };

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

  const statusClass = (value: string) => {
    if (value === 'DELIVERED') {
      return 'bg-green-100 text-green-700';
    }

    if (value === 'CANCELLED') {
      return 'bg-red-100 text-red-700';
    }

    if (value === 'SHIPPED') {
      return 'bg-blue-100 text-blue-700';
    }

    if (value === 'CONFIRMED') {
      return 'bg-yellow-100 text-yellow-700';
    }

    return 'bg-muted text-muted-foreground';
  };

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>

        <p className="mt-2 text-muted-foreground">
          Manage sales orders and sales items.
        </p>
      </div>

      {/* Sales Order Form */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">
            {editingOrderId === null ? 'Add Sales Order' : 'Edit Sales Order'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingOrderId === null
              ? 'Create a new sales order.'
              : 'Update the selected sales order.'}
          </p>
        </div>

        <form
          onSubmit={handleOrderSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Customer */}
          <div>
            <label className="text-sm font-medium">Customer *</label>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Date */}
          <div>
            <label className="text-sm font-medium">Order Date *</label>

            <input
              type="datetime-local"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status *</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className={inputClass}
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes</label>

            <input
              type="text"
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingOrderId === null ? 'Add Order' : 'Update Order'}
            </button>

            {editingOrderId !== null && (
              <button
                type="button"
                onClick={resetOrderForm}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sales Orders */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Sales Orders</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} sales order
            {orders.length !== 1 ? 's' : ''} in records.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No sales orders found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Create your first sales order using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Customer</th>
                  <th className="px-4 py-3 text-sm font-medium">Order Date</th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-sm font-medium">Notes</th>
                  <th className="px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      #{order.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {order.customer?.name || 'Unknown'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {new Date(order.orderDate).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      ৳{Number(order.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm">{order.notes || '-'}</td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editOrder(order)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Item Form */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">
            {editingItemId === null ? 'Add Sales Item' : 'Edit Sales Item'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingItemId === null
              ? 'Add a product to an existing sales order.'
              : 'Update the selected sales item.'}
          </p>
        </div>

        <form
          onSubmit={handleItemSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Sales Order */}
          <div>
            <label className="text-sm font-medium">Sales Order *</label>

            <select
              value={itemOrderId}
              onChange={(e) => setItemOrderId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select sales order</option>

              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  Order #{order.id} — {order.customer?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="text-sm font-medium">Product *</label>

            <select
              value={itemProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select product</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} — {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium">Quantity *</label>

            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="text-sm font-medium">Unit Price *</label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit price"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <p className="text-xs text-muted-foreground md:col-span-2">
            Subtotal and sales order total are calculated automatically by the
            backend.
          </p>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingItemId === null ? 'Add Item' : 'Update Item'}
            </button>

            {editingItemId !== null && (
              <button
                type="button"
                onClick={resetItemForm}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sales Items */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Sales Items</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} sales item
            {items.length !== 1 ? 's' : ''} in records.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No sales items found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add items to your sales orders using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Order</th>
                  <th className="px-4 py-3 text-sm font-medium">Product</th>
                  <th className="px-4 py-3 text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-sm font-medium">Unit Price</th>
                  <th className="px-4 py-3 text-sm font-medium">Subtotal</th>
                  <th className="px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      #{item.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      #{item.salesOrder?.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {item.product?.name || 'Unknown'}
                    </td>

                    <td className="px-4 py-3 text-sm">{item.quantity}</td>

                    <td className="px-4 py-3 text-sm">
                      ৳{Number(item.unitPrice).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      ৳{Number(item.subtotal).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editItem(item)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
