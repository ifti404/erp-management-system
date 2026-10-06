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
  };

  const editItem = (item: SalesItem) => {
    setEditingItemId(item.id);
    setItemOrderId(String(item.salesOrder.id));
    setItemProductId(String(item.product.id));
    setQuantity(String(item.quantity));
    setUnitPrice(String(item.unitPrice));
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Sales</h1>
        <p className="text-muted-foreground">
          Manage sales orders and sales items
        </p>
      </div>

      {/* SALES ORDER FORM */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {editingOrderId ? 'Edit Sales Order' : 'Add Sales Order'}
        </h2>

        <form
          onSubmit={handleOrderSubmit}
          className="grid gap-4 md:grid-cols-2"
        >
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="rounded-md border p-2"
          >
            <option value="">Select Customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            required
            className="rounded-md border p-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="rounded-md border p-2"
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input
            type="text"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border p-2"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              {editingOrderId ? 'Update Order' : 'Add Order'}
            </button>

            {editingOrderId && (
              <button
                type="button"
                onClick={resetOrderForm}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* SALES ORDERS TABLE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Sales Orders</h2>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Order Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Notes</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-3">{order.id}</td>

                  <td className="p-3">{order.customer?.name}</td>

                  <td className="p-3">
                    {new Date(order.orderDate).toLocaleString()}
                  </td>

                  <td className="p-3">{order.status}</td>

                  <td className="p-3">
                    ৳{Number(order.totalAmount || 0).toFixed(2)}
                  </td>

                  <td className="p-3">{order.notes}</td>

                  <td className="flex gap-2 p-3">
                    <button
                      onClick={() => editOrder(order)}
                      className="rounded border px-3 py-1"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="rounded border px-3 py-1 text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No sales orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SALES ITEM FORM */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {editingItemId ? 'Edit Sales Item' : 'Add Sales Item'}
        </h2>

        <form onSubmit={handleItemSubmit} className="grid gap-4 md:grid-cols-2">
          <select
            value={itemOrderId}
            onChange={(e) => setItemOrderId(e.target.value)}
            required
            className="rounded-md border p-2"
          >
            <option value="">Select Sales Order</option>

            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                Order #{order.id} — {order.customer?.name}
              </option>
            ))}
          </select>

          <select
            value={itemProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            required
            className="rounded-md border p-2"
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} — {product.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="rounded-md border p-2"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Unit Price"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            required
            className="rounded-md border p-2"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              {editingItemId ? 'Update Item' : 'Add Item'}
            </button>

            {editingItemId && (
              <button
                type="button"
                onClick={resetItemForm}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* SALES ITEMS TABLE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Sales Items</h2>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Unit Price</th>
                <th className="p-3 text-left">Subtotal</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.id}</td>

                  <td className="p-3">#{item.salesOrder?.id}</td>

                  <td className="p-3">{item.product?.name}</td>

                  <td className="p-3">{item.quantity}</td>

                  <td className="p-3">৳{Number(item.unitPrice).toFixed(2)}</td>

                  <td className="p-3">৳{Number(item.subtotal).toFixed(2)}</td>

                  <td className="flex gap-2 p-3">
                    <button
                      onClick={() => editItem(item)}
                      className="rounded border px-3 py-1"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded border px-3 py-1 text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No sales items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
