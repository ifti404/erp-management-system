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

  // =========================
  // FETCH DATA
  // =========================

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

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl font-bold">Purchases</h1>

        <p className="text-sm text-gray-500">
          Manage purchase orders, items, and inventory.
        </p>
      </div>

      {/* =========================
          PURCHASE ORDER FORM
          ========================= */}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          {editingOrderId ? 'Edit Purchase Order' : 'Add Purchase Order'}
        </h2>

        <form onSubmit={handleOrderSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Supplier */}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Supplier *
              </label>

              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
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
              <label className="mb-1 block text-sm font-medium">
                Order Date *
              </label>

              <input
                type="datetime-local"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            {/* Status */}

            <div>
              <label className="mb-1 block text-sm font-medium">Status *</label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="PENDING">PENDING</option>

                <option value="ORDERED">ORDERED</option>

                <option value="RECEIVED">RECEIVED</option>

                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Notes */}

            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              {editingOrderId ? 'Update Purchase Order' : 'Add Purchase Order'}
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
      </div>

      {/* =========================
          PURCHASE ORDERS TABLE
          ========================= */}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="font-semibold">Purchase Orders</h2>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-gray-500">No purchase orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>

                  <th className="px-4 py-3 text-left">Supplier</th>

                  <th className="px-4 py-3 text-left">Order Date</th>

                  <th className="px-4 py-3 text-left">Status</th>

                  <th className="px-4 py-3 text-left">Total</th>

                  <th className="px-4 py-3 text-left">Notes</th>

                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-4 py-3">{order.id}</td>

                    <td className="px-4 py-3">
                      {order.supplier?.name || 'Unknown'}
                    </td>

                    <td className="px-4 py-3">
                      {new Date(order.orderDate).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">{order.status}</td>

                    <td className="px-4 py-3">
                      ৳{Number(order.totalAmount).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">{order.notes || '-'}</td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="rounded-md border px-3 py-1"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-white"
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

      {/* =========================
          PURCHASE ITEM FORM
          ========================= */}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          {editingItemId ? 'Edit Purchase Item' : 'Add Purchase Item'}
        </h2>

        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Purchase Order */}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Purchase Order *
              </label>

              <select
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
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
              <label className="mb-1 block text-sm font-medium">
                Product *
              </label>

              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
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
              <label className="mb-1 block text-sm font-medium">
                Quantity *
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            {/* Unit Cost */}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Unit Cost *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Subtotal and purchase order total are calculated automatically by
            the backend.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-white"
            >
              {editingItemId ? 'Update Purchase Item' : 'Add Purchase Item'}
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
      </div>

      {/* =========================
          PURCHASE ITEMS TABLE
          ========================= */}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="font-semibold">Purchase Items</h2>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-gray-500">No purchase items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>

                  <th className="px-4 py-3 text-left">Order</th>

                  <th className="px-4 py-3 text-left">Product</th>

                  <th className="px-4 py-3 text-left">Quantity</th>

                  <th className="px-4 py-3 text-left">Unit Cost</th>

                  <th className="px-4 py-3 text-left">Subtotal</th>

                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3">{item.id}</td>

                    <td className="px-4 py-3">#{item.purchaseOrder?.id}</td>

                    <td className="px-4 py-3">
                      {item.product?.name || 'Unknown'}
                    </td>

                    <td className="px-4 py-3">{item.quantity}</td>

                    <td className="px-4 py-3">
                      ৳{Number(item.unitCost).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      ৳{Number(item.subtotal).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="rounded-md border px-3 py-1"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-white"
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
