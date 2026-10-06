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
        fetch(`${API}/sales-orders`),
        fetch(`${API}/purchase-orders`),
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>

        <p className="text-muted-foreground">
          Manage sales and purchase payments
        </p>
      </div>

      {/* PAYMENT FORM */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {editingId ? 'Edit Payment' : 'Add Payment'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input
            type="datetime-local"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="rounded-md border p-2"
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="rounded-md border p-2"
          />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
            className="rounded-md border p-2"
          >
            <option value="CASH">CASH</option>

            <option value="BANK">BANK</option>

            <option value="MOBILE">MOBILE</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="rounded-md border p-2"
          >
            <option value="PENDING">PENDING</option>

            <option value="PAID">PAID</option>

            <option value="FAILED">FAILED</option>

            <option value="REFUNDED">REFUNDED</option>
          </select>

          <select
            value={orderType}
            onChange={(e) => {
              setOrderType(e.target.value);
              setOrderId('');
            }}
            required
            className="rounded-md border p-2"
          >
            <option value="SALES">Sales Order</option>

            <option value="PURCHASE">Purchase Order</option>
          </select>

          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            className="rounded-md border p-2"
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
              {editingId ? 'Update Payment' : 'Add Payment'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* PAYMENTS TABLE */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Payments</h2>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left">ID</th>

                <th className="p-3 text-left">Date</th>

                <th className="p-3 text-left">Amount</th>

                <th className="p-3 text-left">Method</th>

                <th className="p-3 text-left">Status</th>

                <th className="p-3 text-left">Order</th>

                <th className="p-3 text-left">Notes</th>

                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="p-3">{payment.id}</td>

                  <td className="p-3">
                    {new Date(payment.paymentDate).toLocaleString()}
                  </td>

                  <td className="p-3">৳{Number(payment.amount).toFixed(2)}</td>

                  <td className="p-3">{payment.paymentMethod}</td>

                  <td className="p-3">{payment.status}</td>

                  <td className="p-3">
                    {payment.salesOrder
                      ? `Sales #${payment.salesOrder.id}`
                      : payment.purchaseOrder
                        ? `Purchase #${payment.purchaseOrder.id}`
                        : '-'}
                  </td>

                  <td className="p-3">{payment.notes || '-'}</td>

                  <td className="flex gap-2 p-3">
                    <button
                      onClick={() => editPayment(payment)}
                      className="rounded border px-3 py-1"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deletePayment(payment.id)}
                      className="rounded border px-3 py-1 text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-muted-foreground"
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
