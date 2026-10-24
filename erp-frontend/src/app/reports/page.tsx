'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

type Order = { id: number; transactionId?: string | null; orderDate: string; dueDate?: string | null; status: string; totalAmount: number; customer?: { name: string }; supplier?: { name: string } };
type Payment = { id: number; amount: number; paymentDate: string; status: string; salesOrder?: { id: number }; purchaseOrder?: { id: number } };
type Inventory = { quantity: number; product: { name: string; sku: string; reorderLevel: number } };
type SalesReturn = { id: number; salesOrderId: number; customerName: string; reason: string; settlementType: string; settlementStatus: string; returnAmount: number; refundAmount: number; createdAt: string; items: { productName: string; sku: string; quantity: number; restock: boolean }[] };
type Expense = { id: number; category: { name: string }; amount: number; expenseDate: string; paymentMethod: string; reference?: string; notes?: string };
type BalanceRow = { type: 'Sales' | 'Purchase'; id: number; transactionId: string; party: string; date: string; dueDate?: string | null; status: string; total: number; paid: number; balance: number };

function inRange(date: string, from: string, to: string) {
  const value = date.slice(0, 10);
  return (!from || value >= from) && (!to || value <= to);
}
const money = (value: number) => `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function csvCell(value: string | number) {
  const text = String(value);
  const safe = typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export default function ReportsPage() {
  const [sales, setSales] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [format, setFormat] = useState<'CSV' | 'JSON' | 'PDF'>('CSV');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([apiFetch(`${API_BASE}/sales-orders`), apiFetch(`${API_BASE}/purchase-orders`), apiFetch(`${API_BASE}/payments`), apiFetch(`${API_BASE}/inventory`), apiFetch(`${API_BASE}/sales-returns`), apiFetch(`${API_BASE}/expenses`)]).then(async (responses) => {
      if (responses.some((response) => !response.ok)) throw new Error('Could not load reports. Check that the backend is running.');
      return Promise.all(responses.map((response) => response.json()));
    }).then(([salesData, purchaseData, paymentData, inventoryData, returnData, expenseData]) => {
      if (!active) return;
      setSales(salesData as Order[]); setPurchases(purchaseData as Order[]); setPayments(paymentData as Payment[]); setInventory(inventoryData as Inventory[]); setReturns(returnData as SalesReturn[]); setExpenses(expenseData as Expense[]);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load reports.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const data = useMemo(() => {
    const paidSales = new Map<number, number>(); const paidPurchases = new Map<number, number>();
    let receivedInPeriod = 0; let paidOutInPeriod = 0;
    for (const payment of payments) {
      if (payment.status !== 'PAID' && payment.status !== 'REFUNDED') continue;
      const amount = Number(payment.amount);
      if (payment.salesOrder) { const signed = payment.status === 'PAID' ? amount : -amount; paidSales.set(payment.salesOrder.id, (paidSales.get(payment.salesOrder.id) ?? 0) + signed); if (inRange(payment.paymentDate, from, to)) receivedInPeriod += signed; }
      if (payment.purchaseOrder && payment.status === 'PAID') { if (inRange(payment.paymentDate, from, to)) paidOutInPeriod += amount; }
      if (payment.purchaseOrder) paidPurchases.set(payment.purchaseOrder.id, (paidPurchases.get(payment.purchaseOrder.id) ?? 0) + (payment.status === 'PAID' ? amount : -amount));
    }
    const matches = (order: Order) => inRange(order.orderDate, from, to) && (status === 'ALL' || order.status === status);
    const salesRows: BalanceRow[] = sales.filter(matches).filter((order) => !['CANCELLED', 'RETURNED'].includes(order.status)).map((order) => {
      const total = Number(order.totalAmount); const returned = returns.filter((entry) => entry.salesOrderId === order.id).reduce((sum, entry) => sum + Number(entry.returnAmount), 0); const paid = paidSales.get(order.id) ?? 0;
      return { type: 'Sales', id: order.id, transactionId: order.transactionId ?? `ORD-${String(order.id).padStart(2, '0')}`, party: order.customer?.name ?? '—', date: order.orderDate, dueDate: order.dueDate, status: order.status, total, paid, balance: Math.max(0, total - returned - paid) };
    });
    const purchaseRows: BalanceRow[] = purchases.filter(matches).filter((order) => order.status !== 'CANCELLED').map((order) => {
      const total = Number(order.totalAmount); const paid = paidPurchases.get(order.id) ?? 0;
      return { type: 'Purchase', id: order.id, transactionId: order.transactionId ?? `PUR-${String(order.id).padStart(2, '0')}`, party: order.supplier?.name ?? '—', date: order.orderDate, dueDate: order.dueDate, status: order.status, total, paid, balance: Math.max(0, total - paid) };
    });
    const activeSales = salesRows;
    const activePurchases = purchaseRows;
    return {
      rows: [...salesRows, ...purchaseRows].sort((a, b) => b.date.localeCompare(a.date)),
      salesTotal: activeSales.reduce((sum, row) => sum + row.total, 0),
      salesOutstanding: activeSales.reduce((sum, row) => sum + row.balance, 0),
      purchaseTotal: activePurchases.reduce((sum, row) => sum + row.total, 0),
      purchaseOutstanding: activePurchases.reduce((sum, row) => sum + row.balance, 0),
      lowStock: inventory.filter((item) => item.quantity <= item.product.reorderLevel).length,
      returnTotal: returns.filter((entry) => inRange(entry.createdAt, from, to)).reduce((sum, entry) => sum + Number(entry.returnAmount), 0),
      expenseTotal: expenses.filter((entry) => inRange(entry.expenseDate, from, to)).reduce((sum, entry) => sum + Number(entry.amount), 0),
      receivedInPeriod, paidOutInPeriod,
      unpaid: [...salesRows, ...purchaseRows].filter((row) => row.balance > 0),
    };
  }, [expenses, from, inventory, payments, purchases, returns, sales, status, to]);

  const aging = useMemo(() => {
    const buckets = [
      { label: 'No due date', amount: 0 }, { label: 'Not yet due', amount: 0 },
      { label: '1–30 days', amount: 0 }, { label: '31–60 days', amount: 0 },
      { label: '61–90 days', amount: 0 }, { label: 'Over 90 days', amount: 0 },
    ];
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    for (const row of data.unpaid) {
      if (!row.dueDate) { buckets[0].amount += row.balance; continue; }
      const [year, month, day] = row.dueDate.slice(0, 10).split('-').map(Number);
      const daysOverdue = Math.floor((todayUtc - Date.UTC(year, month - 1, day)) / 86400000);
      if (daysOverdue <= 0) buckets[1].amount += row.balance;
      else if (daysOverdue <= 30) buckets[2].amount += row.balance;
      else if (daysOverdue <= 60) buckets[3].amount += row.balance;
      else if (daysOverdue <= 90) buckets[4].amount += row.balance;
      else buckets[5].amount += row.balance;
    }
    return buckets;
  }, [data.unpaid]);

  function downloadCsv() {
    const headings = ['Type', 'Order', 'Customer or supplier', 'Order date', 'Status', 'Total', 'Net paid', 'Balance due'];
    exportReport('gamma-erp-order-balances', headings, data.rows.map((row) => [row.type, row.transactionId, row.party, row.date.slice(0, 10), row.status, row.total.toFixed(2), row.paid.toFixed(2), row.balance.toFixed(2)]));
  }

  function downloadInventoryCsv() {
    const low = inventory.filter((item) => item.quantity <= item.product.reorderLevel);
    exportReport('gamma-erp-low-stock', ['Product', 'SKU', 'Quantity available', 'Reorder level'], low.map((item) => [item.product.name, item.product.sku, item.quantity, item.product.reorderLevel]));
  }

  function downloadReturnsCsv() {
    const rows = returns.filter((entry) => inRange(entry.createdAt, from, to));
    exportReport('gamma-erp-sales-returns', ['Return', 'Sales order', 'Customer', 'Date', 'Reason', 'Settlement type', 'Settlement status', 'Returned value', 'Cash refund', 'Products'], rows.map((entry) => [entry.id, entry.salesOrderId, entry.customerName, entry.createdAt.slice(0, 10), entry.reason, entry.settlementType, entry.settlementStatus, Number(entry.returnAmount).toFixed(2), Number(entry.refundAmount).toFixed(2), entry.items.map((item) => `${item.quantity} x ${item.productName}${item.restock ? ' (restocked)' : ''}`).join('; ')]));
  }

  function downloadExpenses() {
    const rows = expenses.filter((entry) => inRange(entry.expenseDate, from, to));
    exportReport('gamma-erp-expenses', ['Date', 'Category', 'Amount', 'Payment method', 'Reference', 'Notes'], rows.map((entry) => [entry.expenseDate, entry.category.name, Number(entry.amount).toFixed(2), entry.paymentMethod, entry.reference ?? '', entry.notes ?? '']));
  }

  function exportReport(name: string, headings: string[], rows: (string | number)[][]) {
    if (format === 'PDF') { window.print(); return; }
    const extension = format.toLowerCase();
    const contents = format === 'JSON'
      ? JSON.stringify(rows.map((row) => Object.fromEntries(headings.map((heading, index) => [heading, row[index]]))), null, 2)
      : [headings, ...rows].map((line) => line.map(csvCell).join(',')).join('\r\n');
    const mime = format === 'JSON' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8';
    const url = URL.createObjectURL(new Blob([format === 'CSV' ? '\uFEFF' : '', contents], { type: mime }));
    const link = document.createElement('a'); link.href = url; link.download = `${name}.${extension}`; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="page-stack">
    <header className="page-heading">
      <div><p className="eyebrow">FINANCIAL OVERVIEW</p><h1>Reports</h1><p>Review order balances and payments, then prioritize overdue accounts.</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="filter-field">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="control" /></label>
        <label className="filter-field">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="control" /></label>
        <label className="filter-field">Order status<select value={status} onChange={(event) => setStatus(event.target.value)} className="control"><option value="ALL">All statuses</option>{['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="filter-field">File format<select className="control" value={format} onChange={(event) => setFormat(event.target.value as 'CSV' | 'JSON' | 'PDF')}><option value="CSV">CSV spreadsheet</option><option value="JSON">JSON data</option><option value="PDF">Print / Save as PDF</option></select></label>
        <button type="button" onClick={downloadCsv} disabled={loading || data.rows.length === 0} className="button-primary">Export orders</button>
        <button type="button" onClick={downloadInventoryCsv} disabled={loading || data.lowStock === 0} className="button-secondary">Export low stock</button>
        <button type="button" onClick={downloadReturnsCsv} disabled={loading || returns.length === 0} className="button-secondary">Export returns</button>
        <button type="button" onClick={downloadExpenses} disabled={loading || expenses.length === 0} className="button-secondary">Export expenses</button>
      </div>
    </header>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading reports…</p> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ['Sales orders', money(data.salesTotal)], ['Customers owe', money(data.salesOutstanding)], ['Received in selected dates', money(data.receivedInPeriod)], ['Returns in selected dates', money(data.returnTotal)], ['Expenses in selected dates', money(data.expenseTotal)],
          ['Purchase orders', money(data.purchaseTotal)], ['Owed to suppliers', money(data.purchaseOutstanding)], ['Paid in selected dates', money(data.paidOutInPeriod)],
        ].map(([label, value]) => <article key={label} className="panel p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article>)}
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{aging.map((bucket) => <article key={bucket.label} className={`panel p-5 ${bucket.label.includes('days') || bucket.label === 'Over 90 days' ? 'border-rose-200' : ''}`}><p className="text-sm text-muted-foreground">{bucket.label}</p><p className="mt-2 text-xl font-semibold">{money(bucket.amount)}</p></article>)}</section>
      <section className="panel p-5"><h2 className="font-semibold">Stock attention</h2><p className="mt-1 text-sm text-muted-foreground">{data.lowStock} product{data.lowStock === 1 ? '' : 's'} at or below reorder level. Use Low-stock CSV to share or work through the reorder list.</p></section>
      <section className="panel overflow-hidden">
        <div className="panel-heading"><div><h2>Unpaid and partly paid orders</h2><p>Balances include paid payments for these orders. Use filters above to narrow the list.</p></div></div>
        {data.unpaid.length === 0 ? <p className="empty-state">No unpaid orders match these filters.</p> : <div className="overflow-x-auto"><table className="data-table min-w-[920px]"><thead><tr>{['Type', 'Trx ID', 'Customer / supplier', 'Date', 'Due date', 'Status', 'Total', 'Paid', 'Balance due'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{data.unpaid.map((row) => <tr key={`${row.type}-${row.id}`}><td>{row.type}</td><td>{row.transactionId}</td><td>{row.party}</td><td>{new Date(row.date).toLocaleDateString()}</td><td>{row.dueDate ?? '—'}</td><td>{row.status}</td><td>{money(row.total)}</td><td>{money(row.paid)}</td><td className="font-semibold">{money(row.balance)}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}
