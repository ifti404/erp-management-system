<<<<<<< HEAD
'use client';

import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

const API = API_BASE;

type Supplier = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  sku: string;
  name: string;
  unitCost: number;
};

type PurchaseOrder = {
  id: number;
  supplier: Supplier;
  orderDate: string;
  dueDate: string | null;
  status: string;
  totalAmount: number;
  notes: string | null;
};

type PurchaseItem = {
  id: number;
  purchaseOrder: PurchaseOrder;
  product: Product;
  quantity: number;
  unitCost: number;
  subtotal: number;
  receivedQuantity: number;
  remainingQuantity: number;
};
type PurchasePayment = { status: string; amount: number; purchaseOrder?: { id: number } };

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Purchase Order form
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // Purchase Item form
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await apiFetch(`${API}/purchase-orders`);

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load purchase orders');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await apiFetch(`${API}/purchase-items`);

      if (!response.ok) {
        throw new Error('Failed to fetch purchase items');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load purchase items');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiFetch(`${API}/suppliers`);

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`${API}/products`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load products');
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await apiFetch(`${API}/payments`);
      if (!response.ok) throw new Error('Could not fetch payments');
      setPayments(await response.json() as PurchasePayment[]);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchOrders(), fetchItems(), fetchPayments()]);
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchOrders(),
        fetchItems(),
        fetchSuppliers(),
        fetchProducts(),
        fetchPayments(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const query = orderSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      String(order.id), order.supplier?.name ?? '', order.status, order.notes ?? '',
    ].some((value) => value.toLowerCase().includes(query));
    const paid = payments.filter((payment) => payment.status === 'PAID' && payment.purchaseOrder?.id === order.id).reduce((sum, payment) => sum + Number(payment.amount), 0);
    const outstanding = order.status !== 'CANCELLED' && paid + 0.001 < Number(order.totalAmount);
    return matchesSearch && (orderStatusFilter === 'ALL' || (orderStatusFilter === 'UNPAID' ? outstanding : order.status === orderStatusFilter));
  });

  // =========================
  // PURCHASE ORDER
  // =========================

  const resetOrderForm = () => {
    setSupplierId('');
    setOrderDate('');
    setDueDate('');
    setStatus('PENDING');
    setNotes('');
    setEditingOrderId(null);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !orderDate || !status) {
      alert('Please fill in all required fields.');
      return;
    }

    const purchaseOrderData = {
      supplier: {
        id: Number(supplierId),
      },
      orderDate,
      dueDate: dueDate || null,
      status,
      notes: notes || null,
    };

    try {
      const url = editingOrderId
        ? `${API}/purchase-orders/${editingOrderId}`
        : `${API}/purchase-orders`;

      const method = editingOrderId ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);

        alert(errorData.message || 'Failed to save purchase order');
        return;
      }

      resetOrderForm();
      await fetchOrders();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrderId(order.id);
    setSupplierId(String(order.supplier.id));
    setOrderDate(order.orderDate ? order.orderDate.substring(0, 16) : '');
    setDueDate(order.dueDate ?? '');
    setStatus(order.status);
    setNotes(order.notes || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDeleteOrder = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this purchase order?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(
        `${API}/purchase-orders/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        alert(errorData.message || 'Failed to delete purchase order');
        return;
      }

      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  // =========================
  // PURCHASE ITEM
  // =========================

  const resetItemForm = () => {
    setPurchaseOrderId('');
    setProductId('');
    setQuantity('1');
    setUnitCost('');
    setEditingItemId(null);
  };

  const handleProductChange = (value: string) => {
    setProductId(value);

    const selectedProduct = products.find(
      (product) => product.id === Number(value),
    );

    if (selectedProduct) {
      setUnitCost(String(selectedProduct.unitCost));
    } else {
      setUnitCost('');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseOrderId || !productId || !quantity || !unitCost) {
      alert('Please fill in all required fields.');
      return;
    }

    if (Number(quantity) < 1) {
      alert('Quantity must be at least 1.');
      return;
    }

    if (Number(unitCost) < 0) {
      alert('Unit cost cannot be negative.');
      return;
    }

    const purchaseItemData = {
      purchaseOrder: {
        id: Number(purchaseOrderId),
      },
      product: {
        id: Number(productId),
      },
      quantity: Number(quantity),
      unitCost: Number(unitCost),
    };

    try {
      const url = editingItemId
        ? `${API}/purchase-items/${editingItemId}`
        : `${API}/purchase-items`;

      const method = editingItemId ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error(errorData);

        alert(errorData.message || 'Failed to save purchase item');
        return;
      }

      resetItemForm();

      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  const handleEditItem = (item: PurchaseItem) => {
    setEditingItemId(item.id);
    setPurchaseOrderId(String(item.purchaseOrder.id));
    setProductId(String(item.product.id));
    setQuantity(String(item.quantity));
    setUnitCost(String(item.unitCost));

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDeleteItem = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this purchase item?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(
        `${API}/purchase-items/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        alert(errorData.message || 'Failed to delete purchase item');
        return;
      }

      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  const handleReceiveItem = async (item: PurchaseItem) => {
    if (item.remainingQuantity <= 0) return;
    const value = window.prompt(
      `Receive quantity (up to ${item.remainingQuantity}) for ${item.product.name}`,
      String(item.remainingQuantity),
    );
    if (value === null) return;
    const receiveQuantity = Number(value);
    if (!Number.isInteger(receiveQuantity) || receiveQuantity < 1 || receiveQuantity > item.remainingQuantity) {
      alert(`Enter a whole number from 1 to ${item.remainingQuantity}.`);
      return;
    }
    try {
      const response = await apiFetch(`${API}/purchase-orders/${item.purchaseOrder.id}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ purchaseItemId: item.id, quantity: receiveQuantity }] }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to receive purchase item');
      }
      await refreshData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to receive purchase item');
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

  const statusClass = (value: string) => {
    if (value === 'RECEIVED') {
      return 'bg-green-100 text-green-700';
    }

    if (value === 'CANCELLED') {
      return 'bg-red-100 text-red-700';
    }

    if (value === 'ORDERED') {
      return 'bg-blue-100 text-blue-700';
    }

    if (value === 'PARTIALLY_RECEIVED') {
      return 'bg-amber-100 text-amber-800';
    }

    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">SUPPLIER OPERATIONS</p><h1>Purchases</h1><p>Manage orders, receive stock, and track supplier balances.</p></div><span className="count-pill">{orders.length} orders</span></header>

      {/* Purchase Order Form */}
      <div className="panel p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">
            {editingOrderId === null
              ? 'Add Purchase Order'
              : 'Edit Purchase Order'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingOrderId === null
              ? 'Create a new purchase order.'
              : 'Update the selected purchase order.'}
          </p>
        </div>

        <form
          onSubmit={handleOrderSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Supplier */}
          <div>
            <label className="text-sm font-medium">Supplier *</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select supplier</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Payment due date</label>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status *</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="PENDING">PENDING</option>
              <option value="ORDERED">ORDERED</option>
              <option value="PARTIALLY_RECEIVED" disabled>
                PARTIALLY RECEIVED
              </option>
              <option value="RECEIVED" disabled>
                RECEIVED
              </option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes</label>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className={inputClass}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingOrderId === null
                ? 'Add Purchase Order'
                : 'Update Purchase Order'}
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

      {/* Purchase Orders */}
      <div className="panel overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Purchase Orders</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} purchase order{orders.length !== 1 ? 's' : ''}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input aria-label="Search purchase orders" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search order, supplier, or notes" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select aria-label="Filter purchase orders by status" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm sm:w-56">
              <option value="ALL">All statuses</option>
              {['PENDING', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
              <option value="UNPAID">Unpaid / partly paid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading purchase orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No purchase orders found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Create your first purchase order using the form above.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No purchase orders match those filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Supplier</th>
                  <th className="px-4 py-3 text-sm font-medium">Order Date</th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-sm font-medium">Paid</th>
                  <th className="px-4 py-3 text-sm font-medium">Balance</th>
                  <th className="px-4 py-3 text-sm font-medium">Notes</th>
                  <th className="px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      #{order.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {order.supplier?.name || 'Unknown'}
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
                      ৳{Number(order.totalAmount).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm">৳{payments.filter((payment) => payment.status === 'PAID' && payment.purchaseOrder?.id === order.id).reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">৳{Math.max(0, Number(order.totalAmount) - payments.filter((payment) => payment.status === 'PAID' && payment.purchaseOrder?.id === order.id).reduce((sum, payment) => sum + Number(payment.amount), 0)).toFixed(2)}</td>

                    <td className="px-4 py-3 text-sm">{order.notes || '-'}</td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(`/documents?kind=purchase&id=${order.id}`, '_blank', 'noopener,noreferrer')}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
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

      {/* Purchase Item Form */}
      <div className="panel p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">
            {editingItemId === null
              ? 'Add Purchase Item'
              : 'Edit Purchase Item'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingItemId === null
              ? 'Add a product to an existing purchase order.'
              : 'Update the selected purchase item.'}
          </p>
        </div>

        <form
          onSubmit={handleItemSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Purchase Order */}
          <div>
            <label className="text-sm font-medium">Purchase Order *</label>

            <select
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select purchase order</option>

              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id} — {order.supplier?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="text-sm font-medium">Product *</label>

            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Unit Cost */}
          <div>
            <label className="text-sm font-medium">Unit Cost *</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className={inputClass}
            />
          </div>

          <p className="text-xs text-muted-foreground md:col-span-2">
            Subtotal and purchase order total are calculated automatically by
            the backend.
          </p>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingItemId === null
                ? 'Add Purchase Item'
                : 'Update Purchase Item'}
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

      {/* Purchase Items */}
      <div className="panel overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Purchase Items</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} purchase item
            {items.length !== 1 ? 's' : ''} in records.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading purchase items...
          </p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No purchase items found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add items to your purchase orders using the form above.
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
                  <th className="px-4 py-3 text-sm font-medium">Ordered</th>
                  <th className="px-4 py-3 text-sm font-medium">Received</th>
                  <th className="px-4 py-3 text-sm font-medium">Remaining</th>
                  <th className="px-4 py-3 text-sm font-medium">Unit Cost</th>
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
                      #{item.purchaseOrder?.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {item.product?.name || 'Unknown'}
                    </td>

                    <td className="px-4 py-3 text-sm">{item.quantity}</td>

                    <td className="px-4 py-3 text-sm">{item.receivedQuantity}</td>

                    <td className="px-4 py-3 text-sm">{item.remainingQuantity}</td>

                    <td className="px-4 py-3 text-sm">
                      ৳{Number(item.unitCost).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      ৳{Number(item.subtotal).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {item.remainingQuantity > 0 && (
                          <button
                            onClick={() => handleReceiveItem(item)}
                            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                          >
                            Receive
                          </button>
                        )}
                        <button
                          onClick={() => handleEditItem(item)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
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
=======
'use client';

import { useEffect, useState } from 'react';

type Supplier = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  sku: string;
  name: string;
  unitCost: number;
};

type PurchaseOrder = {
  id: number;
  supplier: Supplier;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes: string | null;
};

type PurchaseItem = {
  id: number;
  purchaseOrder: PurchaseOrder;
  product: Product;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  // Purchase Order form
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // Purchase Item form
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/purchase-orders');

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load purchase orders');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/purchase-items');

      if (!response.ok) {
        throw new Error('Failed to fetch purchase items');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load purchase items');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/suppliers');

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/products');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load products');
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchOrders(), fetchItems()]);
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchOrders(),
        fetchItems(),
        fetchSuppliers(),
        fetchProducts(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =========================
  // PURCHASE ORDER
  // =========================

  const resetOrderForm = () => {
    setSupplierId('');
    setOrderDate('');
    setStatus('PENDING');
    setNotes('');
    setEditingOrderId(null);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !orderDate || !status) {
      alert('Please fill in all required fields.');
      return;
    }

    const purchaseOrderData = {
      supplier: {
        id: Number(supplierId),
      },
      orderDate,
      status,
      notes: notes || null,
    };

    try {
      const url = editingOrderId
        ? `http://localhost:8080/api/purchase-orders/${editingOrderId}`
        : 'http://localhost:8080/api/purchase-orders';

      const method = editingOrderId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);

        alert(errorData.message || 'Failed to save purchase order');
        return;
      }

      resetOrderForm();
      await fetchOrders();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrderId(order.id);
    setSupplierId(String(order.supplier.id));
    setOrderDate(order.orderDate ? order.orderDate.substring(0, 16) : '');
    setStatus(order.status);
    setNotes(order.notes || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDeleteOrder = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this purchase order?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/purchase-orders/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        alert(errorData.message || 'Failed to delete purchase order');
        return;
      }

      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  // =========================
  // PURCHASE ITEM
  // =========================

  const resetItemForm = () => {
    setPurchaseOrderId('');
    setProductId('');
    setQuantity('1');
    setUnitCost('');
    setEditingItemId(null);
  };

  const handleProductChange = (value: string) => {
    setProductId(value);

    const selectedProduct = products.find(
      (product) => product.id === Number(value),
    );

    if (selectedProduct) {
      setUnitCost(String(selectedProduct.unitCost));
    } else {
      setUnitCost('');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseOrderId || !productId || !quantity || !unitCost) {
      alert('Please fill in all required fields.');
      return;
    }

    if (Number(quantity) < 1) {
      alert('Quantity must be at least 1.');
      return;
    }

    if (Number(unitCost) < 0) {
      alert('Unit cost cannot be negative.');
      return;
    }

    const purchaseItemData = {
      purchaseOrder: {
        id: Number(purchaseOrderId),
      },
      product: {
        id: Number(productId),
      },
      quantity: Number(quantity),
      unitCost: Number(unitCost),
    };

    try {
      const url = editingItemId
        ? `http://localhost:8080/api/purchase-items/${editingItemId}`
        : 'http://localhost:8080/api/purchase-items';

      const method = editingItemId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error(errorData);

        alert(errorData.message || 'Failed to save purchase item');
        return;
      }

      resetItemForm();

      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  const handleEditItem = (item: PurchaseItem) => {
    setEditingItemId(item.id);
    setPurchaseOrderId(String(item.purchaseOrder.id));
    setProductId(String(item.product.id));
    setQuantity(String(item.quantity));
    setUnitCost(String(item.unitCost));

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDeleteItem = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this purchase item?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/purchase-items/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        alert(errorData.message || 'Failed to delete purchase item');
        return;
      }

      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

  const statusClass = (value: string) => {
    if (value === 'RECEIVED') {
      return 'bg-green-100 text-green-700';
    }

    if (value === 'CANCELLED') {
      return 'bg-red-100 text-red-700';
    }

    if (value === 'ORDERED') {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-muted text-muted-foreground';
  };

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>

        <p className="mt-2 text-muted-foreground">
          Manage purchase orders, items, and inventory.
        </p>
      </div>

      {/* Purchase Order Form */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">
            {editingOrderId === null
              ? 'Add Purchase Order'
              : 'Edit Purchase Order'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingOrderId === null
              ? 'Create a new purchase order.'
              : 'Update the selected purchase order.'}
          </p>
        </div>

        <form
          onSubmit={handleOrderSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Supplier */}
          <div>
            <label className="text-sm font-medium">Supplier *</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select supplier</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
              className={inputClass}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium">Status *</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="PENDING">PENDING</option>
              <option value="ORDERED">ORDERED</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes</label>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className={inputClass}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingOrderId === null
                ? 'Add Purchase Order'
                : 'Update Purchase Order'}
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

      {/* Purchase Orders */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Purchase Orders</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} purchase order
            {orders.length !== 1 ? 's' : ''} in records.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading purchase orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No purchase orders found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Create your first purchase order using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Supplier</th>
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
                      {order.supplier?.name || 'Unknown'}
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
                      ৳{Number(order.totalAmount).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm">{order.notes || '-'}</td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
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

      {/* Purchase Item Form */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">
            {editingItemId === null
              ? 'Add Purchase Item'
              : 'Edit Purchase Item'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingItemId === null
              ? 'Add a product to an existing purchase order.'
              : 'Update the selected purchase item.'}
          </p>
        </div>

        <form
          onSubmit={handleItemSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Purchase Order */}
          <div>
            <label className="text-sm font-medium">Purchase Order *</label>

            <select
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select purchase order</option>

              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id} — {order.supplier?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="text-sm font-medium">Product *</label>

            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Unit Cost */}
          <div>
            <label className="text-sm font-medium">Unit Cost *</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className={inputClass}
            />
          </div>

          <p className="text-xs text-muted-foreground md:col-span-2">
            Subtotal and purchase order total are calculated automatically by
            the backend.
          </p>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingItemId === null
                ? 'Add Purchase Item'
                : 'Update Purchase Item'}
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

      {/* Purchase Items */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Purchase Items</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} purchase item
            {items.length !== 1 ? 's' : ''} in records.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading purchase items...
          </p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No purchase items found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add items to your purchase orders using the form above.
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
                  <th className="px-4 py-3 text-sm font-medium">Unit Cost</th>
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
                      #{item.purchaseOrder?.id}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {item.product?.name || 'Unknown'}
                    </td>

                    <td className="px-4 py-3 text-sm">{item.quantity}</td>

                    <td className="px-4 py-3 text-sm">
                      ৳{Number(item.unitCost).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium">
                      ৳{Number(item.subtotal).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
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
>>>>>>> edc71aefa89594cf9040eba79f454355b029bdec
