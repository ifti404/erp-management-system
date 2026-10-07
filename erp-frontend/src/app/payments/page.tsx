'use client';

import { useEffect, useState } from 'react';

const API = 'http://localhost:8080/api';

type SalesOrder = {
  id: number;
  customer: {
    name: string;
  };
  totalAmount: number;
};

type PurchaseOrder = {
  id: number;
  supplier: {
    name: string;
  };
  totalAmount: number;
};

type Payment = {
  id: number;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  status: string;
  salesOrder?: SalesOrder;
  purchaseOrder?: PurchaseOrder;
  notes?: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [paymentDate, setPaymentDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [status, setStatus] = useState('PENDING');
  const [orderType, setOrderType] = useState('SALES');
  const [orderId, setOrderId] = useState('');
  const [notes, setNotes] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    const [paymentsResponse, salesOrdersResponse, purchaseOrdersResponse] =
      await Promise.all([
        fetch(`${API}/payments`),
        fetch(`${API}/payments/unpaid-sales-orders`),
        fetch(`${API}/payments/unpaid-purchase-orders`),
      ]);

    const [paymentsData, salesOrdersData, purchaseOrdersData] =
      await Promise.all([
        paymentsResponse.json(),
        salesOrdersResponse.json(),
        purchaseOrdersResponse.json(),
      ]);

    setPayments(paymentsData);
    setSalesOrders(salesOrdersData);
    setPurchaseOrders(purchaseOrdersData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setPaymentDate('');
    setAmount('');
    setPaymentMethod('CASH');
    setStatus('PENDING');
    setOrderType('SALES');
    setOrderId('');
    setNotes('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const paymentData = {
      paymentDate,
      amount: Number(amount),
      paymentMethod,
      status,
      salesOrder:
        orderType === 'SALES'
          ? {
              id: Number(orderId),
            }
          : null,
      purchaseOrder:
        orderType === 'PURCHASE'
          ? {
              id: Number(orderId),
            }
          : null,
      notes,
    };

    const url = editingId ? `${API}/payments/${editingId}` : `${API}/payments`;

    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'Failed to save payment');

      return;
    }

    resetForm();
    await fetchData();
  };

  const editPayment = (payment: Payment) => {
    setEditingId(payment.id);

    setPaymentDate(payment.paymentDate.slice(0, 16));

    setAmount(String(payment.amount));
    setPaymentMethod(payment.paymentMethod);
    setStatus(payment.status);

    if (payment.salesOrder) {
      setOrderType('SALES');
      setOrderId(String(payment.salesOrder.id));
    } else if (payment.purchaseOrder) {
      setOrderType('PURCHASE');
      setOrderId(String(payment.purchaseOrder.id));
    } else {
      setOrderType('SALES');
      setOrderId('');
    }

    setNotes(payment.notes || '');
  };

  const deletePayment = async (id: number) => {
    if (!confirm('Delete this payment?')) {
      return;
    }

    const response = await fetch(`${API}/payments/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();

      alert(error.message || 'Failed to delete payment');

      return;
    }

    await fetchData();
  };

  const inputClass =
    'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20';

  const statusClass = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'PAID':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      case 'FAILED':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'REFUNDED':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'PENDING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Manage sales and purchase payments
        </p>
      </div>

      {/* PAYMENT FORM */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {editingId ? 'Edit Payment' : 'Add Payment'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Record a payment against a sales or purchase order.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Payment Date
            </label>
            <input
              type="datetime-local"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className={inputClass}
            >
              <option value="CASH">CASH</option>
              <option value="BANK">BANK</option>
              <option value="MOBILE">MOBILE</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className={inputClass}
            >
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => {
                setOrderType(e.target.value);
                setOrderId('');
              }}
              required
              className={inputClass}
            >
              <option value="SALES">Sales Order</option>
              <option value="PURCHASE">Purchase Order</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select Order</option>

              {orderType === 'SALES'
                ? salesOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Sales #{order.id} — {order.customer?.name}
                    </option>
                  ))
                : purchaseOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Purchase #{order.id} — {order.supplier?.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes</label>
            <input
              type="text"
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {editingId ? 'Update Payment' : 'Add Payment'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* PAYMENTS TABLE */}
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Payment Records</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {payments.length} payment{payments.length === 1 ? '' : 's'} recorded
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Method</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{payment.id}</td>

                  <td className="px-4 py-3">
                    {new Date(payment.paymentDate).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    ৳{Number(payment.amount).toFixed(2)}
                  </td>

                  <td className="px-4 py-3">{payment.paymentMethod}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        payment.status,
                      )}`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {payment.salesOrder
                      ? `Sales #${payment.salesOrder.id}`
                      : payment.purchaseOrder
                        ? `Purchase #${payment.purchaseOrder.id}`
                        : '-'}
                  </td>

                  <td className="max-w-xs truncate px-4 py-3">
                    {payment.notes || '-'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editPayment(payment)}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deletePayment(payment.id)}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No payments found.
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
