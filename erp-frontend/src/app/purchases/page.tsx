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
