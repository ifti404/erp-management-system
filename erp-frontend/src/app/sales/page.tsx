'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

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
  deliveryCharge: number;
  courier: string | null;
  parcelId: string | null;
  notes: string | null;
};

type SalesItem = {
  id: number;
  salesOrder: SalesOrder;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const inputClass =
  'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring';

const buttonClass =
  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50';

const money = (value: number | null | undefined) =>
  `৳${Number(value ?? 0).toFixed(2)}`;

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [items, setItems] = useState<SalesItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Order form
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(localDateTimeValue());
  const [status, setStatus] = useState('PENDING');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [courier, setCourier] = useState('');
  const [parcelId, setParcelId] = useState('');
  const [notes, setNotes] = useState('');

  // Item form
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const fetchData = async () => {
    const endpoints = [
      `${API}/sales-orders`,
      `${API}/sales-items`,
      `${API}/customers`,
      `${API}/products`,
    ];

    const responses = await Promise.all(endpoints.map((url) => fetch(url)));

    for (const response of responses) {
      if (!response.ok) {
        throw new Error(
          'Could not load sales data. Check that the backend is running.',
        );
      }
    }

    const [ordersData, itemsData, customersData, productsData] =
      await Promise.all(responses.map((response) => response.json()));

    setOrders(ordersData);
    setItems(itemsData);
    setCustomers(customersData);
    setProducts(productsData);

    return ordersData as SalesOrder[];
  };

  useEffect(() => {
    fetchData()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const resetOrderForm = () => {
    setEditingOrderId(null);
    setCustomerId('');
    setOrderDate(localDateTimeValue());
    setStatus('PENDING');
    setDeliveryCharge('0');
    setCourier('');
    setParcelId('');
    setNotes('');
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setProductId('');
    setQuantity('1');
    setUnitPrice('');
  };

  const handleProductChange = (value: string) => {
    setProductId(value);

    const product = products.find((p) => p.id === Number(value));
    setUnitPrice(product ? String(product.sellingPrice) : '');
  };

  const selectedOrder = orders.find(
    (order) => order.id === Number(selectedOrderId),
  );

  const selectedOrderItems = items.filter(
    (item) => item.salesOrder?.id === Number(selectedOrderId),
  );

  const selectedItemsSubtotal = selectedOrderItems.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0,
  );

  const selectedDeliveryCharge = Number(selectedOrder?.deliveryCharge ?? 0);

  const selectedCodAmount =
    selectedOrder?.totalAmount ??
    selectedItemsSubtotal + selectedDeliveryCharge;

  const previewItemSubtotal = Number(quantity || 0) * Number(unitPrice || 0);

  const orderSubtotalById = useMemo(() => {
    const totals = new Map<number, number>();

    for (const item of items) {
      const orderId = item.salesOrder?.id;
      if (orderId == null) continue;

      totals.set(
        orderId,
        (totals.get(orderId) ?? 0) + Number(item.subtotal || 0),
      );
    }

    return totals;
  }, [items]);

  const handleOrderSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const charge = Number(deliveryCharge);

    if (!Number.isFinite(charge) || charge < 0) {
      setError('Delivery charge must be zero or greater.');
      return;
    }

    setSaving(true);

    try {
      const orderData = {
        customer: { id: Number(customerId) },
        orderDate,
        status,
        deliveryCharge: charge,
        courier: courier || null,
        parcelId: parcelId.trim() || null,
        notes: notes.trim() || null,
      };

      const response = await fetch(
        editingOrderId
          ? `${API}/sales-orders/${editingOrderId}`
          : `${API}/sales-orders`,
        {
          method: editingOrderId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to save the sales order.');
      }

      const savedOrder: SalesOrder = await response.json();

      setSelectedOrderId(String(savedOrder.id));
      resetOrderForm();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order.');
    } finally {
      setSaving(false);
    }
  };

  const handleItemSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!selectedOrderId) {
      setError('Create or select an order before adding products.');
      return;
    }

    const qty = Number(quantity);
    const price = Number(unitPrice);

    if (!Number.isInteger(qty) || qty < 1) {
      setError('Quantity must be a whole number of at least 1.');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('Unit price must be zero or greater.');
      return;
    }

    setSaving(true);

    try {
      const itemData = {
        salesOrder: { id: Number(selectedOrderId) },
        product: { id: Number(productId) },
        quantity: qty,
        unitPrice: price,
      };

      const response = await fetch(
        editingItemId
          ? `${API}/sales-items/${editingItemId}`
          : `${API}/sales-items`,
        {
          method: editingItemId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to save the sales item.');
      }

      resetItemForm();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.');
      await fetchData().catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const editOrder = (order: SalesOrder) => {
    setEditingOrderId(order.id);
    setCustomerId(String(order.customer?.id ?? ''));
    setOrderDate(order.orderDate.slice(0, 16));
    setStatus(order.status);
    setDeliveryCharge(String(order.deliveryCharge ?? 0));
    setCourier(order.courier ?? '');
    setParcelId(order.parcelId ?? '');
    setNotes(order.notes ?? '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editItem = (item: SalesItem) => {
    setSelectedOrderId(String(item.salesOrder.id));
    setEditingItemId(item.id);
    setProductId(String(item.product.id));
    setQuantity(String(item.quantity));
    setUnitPrice(String(item.unitPrice));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteOrder = async (id: number) => {
    if (
      !confirm(
        `Delete order #${id}? Orders with items or payments may not be deletable.`,
      )
    ) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`${API}/sales-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(
          'Could not delete this order. It may contain items or payments.',
        );
      }

      if (selectedOrderId === String(id)) {
        setSelectedOrderId('');
        resetItemForm();
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order.');
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this item and return its quantity to inventory?')) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`${API}/sales-items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete item.');
      }

      if (editingItemId === id) resetItemForm();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item.');
    }
  };

  const statusClass = (value: string) => {
    switch (value) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700';
      case 'CONFIRMED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
        <p className="mt-2 text-muted-foreground">
          Create orders, add products, and track delivery and COD amounts.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            className="mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-8 text-sm text-muted-foreground">
          Loading sales data…
        </div>
      ) : (
        <>
          {/* Order form */}
          <section className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              {editingOrderId
                ? `Edit Order #${editingOrderId}`
                : 'Create Sales Order'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Delivery charge is entered once per order, not per product.
            </p>

            <form
              onSubmit={handleOrderSubmit}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
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

              <div>
                <label className="text-sm font-medium">Order date *</label>
                <input
                  type="datetime-local"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  className={inputClass}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Delivery charge (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Courier</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Not assigned</option>
                  <option value="PATHAO">Pathao</option>
                  <option value="STEADFAST">Steadfast</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Parcel ID</label>
                <input
                  type="text"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  maxLength={100}
                  placeholder="Courier tracking / parcel ID"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={255}
                  placeholder="Optional order notes"
                  className={inputClass}
                />
              </div>

              <div className="rounded-md bg-muted/40 p-4 md:col-span-2">
                <div className="flex justify-between text-sm">
                  <span>Delivery charge</span>
                  <span>{money(Number(deliveryCharge || 0))}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  The final COD amount will include this charge plus all product
                  subtotals.
                </p>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <button type="submit" disabled={saving} className={buttonClass}>
                  {saving
                    ? 'Saving…'
                    : editingOrderId
                      ? 'Update Order'
                      : 'Create Order'}
                </button>
                {editingOrderId !== null && (
                  <button
                    type="button"
                    onClick={resetOrderForm}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Order list */}
          <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold">Sales Orders ({orders.length})</h2>
            </div>

            {orders.length === 0 ? (
              <p className="p-8 text-sm text-muted-foreground">
                No orders yet. Create your first order above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      {[
                        'Order',
                        'Customer',
                        'Date',
                        'Status',
                        'Items',
                        'Delivery',
                        'COD Amount',
                        'Courier / Parcel',
                        'Actions',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-sm font-medium"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {order.customer?.name ?? 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {new Date(order.orderDate).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {money(orderSubtotalById.get(order.id) ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {money(order.deliveryCharge)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {money(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>{order.courier || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.parcelId || 'No parcel ID'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderId(String(order.id));
                                resetItemForm();
                                document
                                  .getElementById('order-items')
                                  ?.scrollIntoView({
                                    behavior: 'smooth',
                                  });
                              }}
                              className="rounded-md border px-3 py-1.5 hover:bg-muted"
                            >
                              Products
                            </button>
                            <button
                              type="button"
                              onClick={() => editOrder(order)}
                              className="rounded-md border px-3 py-1.5 hover:bg-muted"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteOrder(order.id)}
                              className="rounded-md border px-3 py-1.5 text-destructive hover:bg-destructive/10"
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
          </section>

          {/* Order item workflow */}
          <section
            id="order-items"
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold">Order Products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an order, then add each product. Inventory is managed by
              the backend.
            </p>

            <div className="mt-5">
              <label className="text-sm font-medium">Select order *</label>
              <select
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  resetItemForm();
                }}
                className={inputClass}
              >
                <option value="">Select sales order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.id} — {order.customer?.name ?? 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrder && (
              <div className="mt-5 grid gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Items subtotal
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {money(selectedItemsSubtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Delivery charge
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {money(selectedDeliveryCharge)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">COD amount</p>
                  <p className="mt-1 text-lg font-semibold">
                    {money(selectedCodAmount)}
                  </p>
                </div>
              </div>
            )}

            {selectedOrderId && (
              <>
                <form
                  onSubmit={handleItemSubmit}
                  className="mt-6 grid gap-5 md:grid-cols-2"
                >
                  <div>
                    <label className="text-sm font-medium">Product *</label>
                    <select
                      value={productId}
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

                  <div>
                    <label className="text-sm font-medium">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Unit price (৳) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground">
                      Item subtotal preview
                    </p>
                    <p className="mt-1 font-semibold">
                      {money(previewItemSubtotal)}
                    </p>
                  </div>

                  <div className="flex gap-2 md:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className={buttonClass}
                    >
                      {saving
                        ? 'Saving…'
                        : editingItemId !== null
                          ? 'Update Item'
                          : 'Add Product to Order'}
                    </button>
                    {editingItemId !== null && (
                      <button
                        type="button"
                        onClick={resetItemForm}
                        className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-8">
                  <h3 className="font-semibold">
                    Products in Order #{selectedOrderId} (
                    {selectedOrderItems.length})
                  </h3>

                  {selectedOrderItems.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No products have been added to this order yet.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left">
                            {[
                              'Product',
                              'Quantity',
                              'Unit Price',
                              'Subtotal',
                              'Actions',
                            ].map((heading) => (
                              <th
                                key={heading}
                                className="px-4 py-3 text-sm font-medium"
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrderItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b last:border-0"
                            >
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">
                                  {item.product?.name ?? 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.product?.sku ?? ''}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {money(item.unitPrice)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {money(item.subtotal)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editItem(item)}
                                    className="rounded-md border px-3 py-1.5 hover:bg-muted"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteItem(item.id)}
                                    className="rounded-md border px-3 py-1.5 text-destructive hover:bg-destructive/10"
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
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
