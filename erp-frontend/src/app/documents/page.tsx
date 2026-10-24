'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE, apiFetch } from '@/lib/api';

type Party = { name: string; address?: string; phone?: string; email?: string };
type Order = { id: number; transactionId?: string | null; orderDate: string; dueDate?: string | null; status: string; totalAmount: number; deliveryCharge?: number; notes?: string | null; customer?: Party; supplier?: Party };
type Line = { id: number; product: { sku: string; name: string }; quantity: number; unitPrice?: number; unitCost?: number; subtotal: number };
type Payment = { id: number; paymentDate: string; amount: number; paymentMethod: string; status: string; salesOrder?: { id: number }; purchaseOrder?: { id: number }; notes?: string };
type Company = { businessName: string; address?: string; phone?: string; email?: string; taxNumber?: string; currencyCode: string; logoData?: string | null };
const money = (value: number, currency: string) => `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DocumentPage() {
  const [kind, setKind] = useState('');
  const [order, setOrder] = useState<Order | null>(null); const [payment, setPayment] = useState<Payment | null>(null);
  const [lines, setLines] = useState<Line[]>([]); const [payments, setPayments] = useState<Payment[]>([]);
  const [company, setCompany] = useState<Company>({ businessName: 'Gamma ERP Business', currencyCode: 'BDT' });
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    const query = new URLSearchParams(window.location.search); const docKind = query.get('kind') ?? ''; const docId = query.get('id') ?? '';
    const load = async () => {
      try {
        const settingsResponse = await apiFetch(`${API_BASE}/settings/company`);
        if (settingsResponse.ok) setCompany(await settingsResponse.json() as Company);
        setKind(docKind);
        if (docKind === 'payment') {
          const response = await apiFetch(`${API_BASE}/payments/${docId}`); if (!response.ok) throw new Error('Payment was not found.');
          const data = await response.json() as Payment; setPayment(data);
          if (data.salesOrder) { const orderResponse = await apiFetch(`${API_BASE}/sales-orders/${data.salesOrder.id}`); if (orderResponse.ok) setOrder(await orderResponse.json() as Order); }
          if (data.purchaseOrder) { const orderResponse = await apiFetch(`${API_BASE}/purchase-orders/${data.purchaseOrder.id}`); if (orderResponse.ok) setOrder(await orderResponse.json() as Order); }
          return;
        }
        const isSales = docKind === 'sales' || docKind === 'return'; const endpoint = isSales ? 'sales-orders' : 'purchase-orders';
        const orderResponse = await apiFetch(`${API_BASE}/${endpoint}/${docId}`); if (!orderResponse.ok) throw new Error('Order was not found.');
        const currentOrder = await orderResponse.json() as Order; setOrder(currentOrder);
        const [itemResponse, paymentResponse] = await Promise.all([apiFetch(`${API_BASE}/${isSales ? 'sales-items' : 'purchase-items'}`), apiFetch(`${API_BASE}/payments`)]);
        if (itemResponse.ok) { const all = await itemResponse.json() as Line[]; setLines(all.filter((line) => (line as Line & { salesOrder?: { id: number }; purchaseOrder?: { id: number } })[isSales ? 'salesOrder' : 'purchaseOrder']?.id === Number(docId))); }
        if (paymentResponse.ok) { const all = await paymentResponse.json() as Payment[]; setPayments(all.filter((p) => (isSales ? p.salesOrder?.id : p.purchaseOrder?.id) === Number(docId))); }
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load document.'); }
      finally { setLoading(false); }
    };
    void load();
  }, []);
  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0);
  const party = payment ? (order?.customer ?? order?.supplier) : order?.customer ?? order?.supplier;
  const title = kind === 'payment' ? 'Payment receipt' : kind === 'purchase' ? 'Purchase order' : kind === 'return' ? 'Return / refund note' : 'Sales invoice';
  return <div className="mx-auto max-w-4xl space-y-5 print-document">
    <div className="flex flex-wrap items-center justify-between gap-3 no-print"><Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Gamma ERP</Link><button onClick={() => window.print()} disabled={loading || !order} className="button-primary">Print / Save as PDF</button></div>
    {loading ? <p className="empty-state">Preparing document…</p> : error ? <p role="alert" className="alert-error">{error}</p> : order && <article className="panel overflow-hidden print-card">
      <header className="flex flex-col gap-7 border-b p-7 sm:flex-row sm:items-start sm:justify-between sm:p-10"><div className="flex items-start gap-4">{company.logoData && <img src={company.logoData} alt={`${company.businessName} logo`} className="size-16 rounded-xl object-contain"/>}<div><p className="eyebrow">{company.businessName}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><div className="mt-3 space-y-1 text-sm text-muted-foreground">{company.address && <p>{company.address}</p>}{company.phone && <p>{company.phone}</p>}{company.email && <p>{company.email}</p>}{company.taxNumber && <p>Tax / registration: {company.taxNumber}</p>}</div></div></div><div className="text-sm sm:text-right"><p className="font-semibold">{kind === 'payment' ? `Receipt #${payment?.id}` : `${kind === 'purchase' ? 'PO' : 'INV'}-${order.id}`}</p><p className="mt-2 text-muted-foreground">Date: {new Date(payment?.paymentDate ?? order.orderDate).toLocaleDateString()}</p>{order.dueDate && <p className="text-muted-foreground">Due: {order.dueDate}</p>}<p className="mt-2"><span className="status-chip">{kind === 'return' ? 'RETURNED' : kind === 'payment' ? payment?.status : order.status}</span></p></div></header>
      <section className="grid gap-6 border-b p-7 sm:grid-cols-2 sm:p-10"><div><p className="eyebrow">{kind === 'purchase' ? 'SUPPLIER' : 'BILL TO'}</p><p className="mt-2 font-semibold">{party?.name ?? '—'}</p>{party?.address && <p className="text-sm text-muted-foreground">{party.address}</p>}{party?.phone && <p className="text-sm text-muted-foreground">{party.phone}</p>}{party?.email && <p className="text-sm text-muted-foreground">{party.email}</p>}</div><div className="sm:text-right"><p className="eyebrow">ORDER SUMMARY</p><p className="mt-2">Reference #{order.id}</p><p className="text-sm text-muted-foreground">{new Date(order.orderDate).toLocaleString()}</p><p className="text-sm text-muted-foreground">Status: {order.status}</p></div></section>
      {kind === 'payment' ? <section className="p-7 sm:p-10"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">Payment method</p><p className="mt-1 font-medium">{payment?.paymentMethod}</p></div><div><p className="text-sm text-muted-foreground">Order reference</p><p className="mt-1 font-medium">{payment?.salesOrder ? `Sales order #${payment.salesOrder.id}` : `Purchase order #${payment?.purchaseOrder?.id}`}</p></div><div><p className="text-sm text-muted-foreground">Payment status</p><p className="mt-1 font-medium">{payment?.status}</p></div>{payment?.notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="mt-1">{payment.notes}</p></div>}</div><div className="mt-8 flex justify-between border-t pt-5 text-lg font-semibold"><span>Amount received / recorded</span><span>{money(Number(payment?.amount ?? 0), company.currencyCode)}</span></div></section> : <>
        {kind === 'return' && <div className="mx-7 mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-10">This note records that the full sales order is marked returned. It is a printable record; returned quantities and credit amounts are not separately posted by the current system.</div>}
        <div className="overflow-x-auto p-4 sm:p-7"><table className="data-table min-w-[560px]"><thead><tr><th>Item</th><th>SKU</th><th className="text-right">Quantity</th><th className="text-right">Unit price</th><th className="text-right">Line total</th></tr></thead><tbody>{lines.map((line) => <tr key={line.id}><td className="font-medium">{line.product.name}</td><td>{line.product.sku}</td><td className="text-right">{line.quantity}</td><td className="text-right">{money(Number(line.unitPrice ?? line.unitCost ?? 0), company.currencyCode)}</td><td className="text-right">{money(Number(line.subtotal), company.currencyCode)}</td></tr>)}</tbody></table></div>
        <section className="ml-auto max-w-sm space-y-2 border-t p-7 text-sm sm:p-10"><div className="flex justify-between"><span>Items subtotal</span><span>{money(lines.reduce((sum, line) => sum + Number(line.subtotal), 0), company.currencyCode)}</span></div>{kind !== 'purchase' && <div className="flex justify-between"><span>Delivery charge</span><span>{money(Number(order.deliveryCharge ?? 0), company.currencyCode)}</span></div>}<div className="flex justify-between border-t pt-3 text-base font-semibold"><span>Order total</span><span>{money(Number(order.totalAmount), company.currencyCode)}</span></div><div className="flex justify-between"><span>Paid</span><span>{money(totalPaid, company.currencyCode)}</span></div><div className="flex justify-between font-semibold"><span>Balance due</span><span>{money(Math.max(0, Number(order.totalAmount) - totalPaid), company.currencyCode)}</span></div></section>
      </>}
      {order.notes && <footer className="border-t px-7 py-5 text-sm text-muted-foreground sm:px-10"><span className="font-medium text-foreground">Notes: </span>{order.notes}</footer>}
      <footer className="border-t px-7 py-5 text-center text-xs text-muted-foreground sm:px-10">Thank you · {company.businessName}</footer>
    </article>}
  </div>;
}
