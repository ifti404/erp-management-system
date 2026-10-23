'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE, apiFetch } from '@/lib/api';

type Party = { id: number; name: string };
type Order = { id: number; orderDate: string; dueDate: string | null; status: string; totalAmount: number; customer?: Party; supplier?: Party };
type Payment = { id: number; paymentDate: string; status: string; amount: number; salesOrder?: { id: number }; purchaseOrder?: { id: number } };
type SalesReturn = { id: number; salesOrderId: number; returnAmount: number; createdAt: string; reason: string };
type StatementRow = { date: string; reference: string; description: string; debit: number; credit: number; balance: number; dueDate?: string | null; orderId?: number };
const money = (n: number, currency: string) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateOnly = (date: string) => date.slice(0, 10);

export default function StatementsPage() {
  const [kind, setKind] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [partyId, setPartyId] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [customers, setCustomers] = useState<Party[]>([]); const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [sales, setSales] = useState<Order[]>([]); const [purchases, setPurchases] = useState<Order[]>([]); const [payments, setPayments] = useState<Payment[]>([]); const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [company, setCompany] = useState<{ businessName?: string; currencyCode?: string }>({});
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { let active = true; Promise.all(['customers', 'suppliers', 'sales-orders', 'purchase-orders', 'payments', 'sales-returns', 'settings/company'].map((path) => apiFetch(`${API_BASE}/${path}`))).then(async (responses) => { if (responses.some((response) => !response.ok)) throw new Error('Could not load account statements.'); return await Promise.all(responses.map((response) => response.json())); }).then(([c, s, so, po, p, r, settings]) => { if (!active) return; setCustomers(c as Party[]); setSuppliers(s as Party[]); setSales(so as Order[]); setPurchases(po as Order[]); setPayments(p as Payment[]); setReturns(r as SalesReturn[]); setCompany(settings as { businessName: string; currencyCode: string }); }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Could not load statements.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const parties = kind === 'CUSTOMER' ? customers : suppliers;
  const party = parties.find((entry) => String(entry.id) === partyId);
  const rows = useMemo(() => {
    if (!partyId) return { rows: [] as StatementRow[], openingBalance: 0, endingBalance: 0 };
    const events: Omit<StatementRow, 'balance'>[] = [];
    if (kind === 'CUSTOMER') {
      for (const order of sales.filter((entry) => entry.customer?.id === Number(partyId) && !['CANCELLED', 'RETURNED'].includes(entry.status))) events.push({ date: order.orderDate, reference: `SO-${order.id}`, description: `Sales order #${order.id} · ${order.status}`, debit: Number(order.totalAmount), credit: 0, dueDate: order.dueDate, orderId: order.id });
      for (const entry of returns.filter((value) => sales.find((o) => o.id === value.salesOrderId)?.customer?.id === Number(partyId))) events.push({ date: entry.createdAt, reference: `RET-${entry.id}`, description: `Returned items · Sales #${entry.salesOrderId} · ${entry.reason}`, debit: 0, credit: Number(entry.returnAmount), orderId: entry.salesOrderId });
      for (const payment of payments.filter((entry) => entry.salesOrder && sales.find((o) => o.id === entry.salesOrder?.id)?.customer?.id === Number(partyId) && ['PAID', 'REFUNDED'].includes(entry.status))) events.push({ date: payment.paymentDate, reference: `PAY-${payment.id}`, description: `${payment.status === 'REFUNDED' ? 'Payment refunded' : 'Payment received'} · Sales #${payment.salesOrder?.id}`, debit: payment.status === 'REFUNDED' ? Number(payment.amount) : 0, credit: payment.status === 'PAID' ? Number(payment.amount) : 0, orderId: payment.salesOrder?.id });
    } else {
      for (const order of purchases.filter((entry) => entry.supplier?.id === Number(partyId) && orderNotCancelled(entry.status))) events.push({ date: order.orderDate, reference: `PO-${order.id}`, description: `Purchase order #${order.id} · ${order.status}`, debit: Number(order.totalAmount), credit: 0, dueDate: order.dueDate, orderId: order.id });
      for (const payment of payments.filter((entry) => entry.purchaseOrder && purchases.find((o) => o.id === entry.purchaseOrder?.id)?.supplier?.id === Number(partyId) && ['PAID', 'REFUNDED'].includes(entry.status))) events.push({ date: payment.paymentDate, reference: `PAY-${payment.id}`, description: `${payment.status === 'REFUNDED' ? 'Payment returned' : 'Payment sent'} · Purchase #${payment.purchaseOrder?.id}`, debit: payment.status === 'REFUNDED' ? Number(payment.amount) : 0, credit: payment.status === 'PAID' ? Number(payment.amount) : 0, orderId: payment.purchaseOrder?.id });
    }
    events.sort((a, b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
    const rows: StatementRow[] = []; let balance = 0; let openingBalance = 0;
    for (const event of events) {
      balance += event.debit - event.credit;
      const date = dateOnly(event.date);
      if ((!from || date >= from) && (!to || date <= to)) rows.push({ ...event, balance });
      else if (from && date < from) openingBalance = balance;
    }
    return { rows, openingBalance, endingBalance: rows.at(-1)?.balance ?? openingBalance };
  }, [from, kind, partyId, payments, purchases, returns, sales, to]);
  const { rows: statementRows, openingBalance, endingBalance } = rows;
  const overdueDays = (due: string) => Math.max(0, Math.floor((new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`).getTime() - new Date(`${due}T00:00:00`).getTime()) / 86400000));
  function printStatement() { window.print(); }
  function exportCsv() { const values = [['Date', 'Reference', 'Description', 'Due date', 'Debit', 'Credit', 'Running balance'], ...statementRows.map((r) => [dateOnly(r.date), r.reference, r.description, r.dueDate ?? '', r.debit.toFixed(2), r.credit.toFixed(2), r.balance.toFixed(2)])]; const csv = values.map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${kind.toLowerCase()}-statement-${partyId}.csv`; a.click(); URL.revokeObjectURL(url); }
  return <div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">FINANCE & FOLLOW-UP</p><h1>Account statements</h1><p>Review a customer or supplier account over a date range.</p></div><div className="flex gap-2 no-print"><button onClick={exportCsv} disabled={!partyId || !statementRows.length} className="button-secondary">Download CSV</button><button onClick={printStatement} disabled={!partyId} className="button-primary">Print statement</button></div></header>
    {error && <p role="alert" className="alert-error">{error}</p>}
    <section className="panel grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 no-print"><label className="filter-field">Account<select value={kind} onChange={(e) => { setKind(e.target.value as 'CUSTOMER' | 'SUPPLIER'); setPartyId(''); }} className="control"><option value="CUSTOMER">Customer account</option><option value="SUPPLIER">Supplier account</option></select></label><label className="filter-field">Name<select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="control"><option value="">Select account</option>{parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="filter-field">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="control" /></label><label className="filter-field">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="control" /></label></section>
    {loading ? <p className="empty-state">Loading statements…</p> : !partyId ? <p className="empty-state">Choose a customer or supplier to view their statement.</p> : <section className="panel print-surface"><div className="panel-heading"><div><p className="eyebrow">{company.businessName ?? 'Gamma ERP'}</p><h2>{kind === 'CUSTOMER' ? 'Customer statement' : 'Supplier statement'} · {party?.name}</h2><p>{from || 'All time'}{to ? ` through ${to}` : ''}</p></div><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline no-print" href="/">Gamma ERP</Link></div><div className="grid gap-3 border-b p-4 sm:grid-cols-3"><div><span className="text-xs text-muted-foreground">Opening balance</span><p className="font-semibold">{money(openingBalance, company.currencyCode ?? 'BDT')}</p></div><div><span className="text-xs text-muted-foreground">Period activity</span><p className="font-semibold">{statementRows.length} entries</p></div><div><span className="text-xs text-muted-foreground">Balance at end</span><p className="font-semibold">{money(endingBalance, company.currencyCode ?? 'BDT')}</p></div></div>{statementRows.length === 0 ? <p className="empty-state">No account activity matches this date range.</p> : <div className="overflow-x-auto"><table className="data-table min-w-[740px]"><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Due</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Balance</th></tr></thead><tbody><tr className="opening-row"><td colSpan={6}>Opening balance</td><td className="text-right font-semibold">{money(openingBalance, company.currencyCode ?? 'BDT')}</td></tr>{statementRows.map((row, index) => { const age = row.dueDate && row.balance > 0 ? overdueDays(row.dueDate) : 0; return <tr key={`${row.reference}-${index}`}><td>{new Date(row.date).toLocaleDateString()}</td><td className="font-medium">{row.reference}</td><td>{row.description}</td><td>{row.dueDate ? <span className={age > 0 ? 'text-destructive' : 'text-muted-foreground'}>{row.dueDate}{age ? ` · ${age}d overdue` : ''}</span> : '—'}</td><td className="text-right">{row.debit ? money(row.debit, company.currencyCode ?? 'BDT') : '—'}</td><td className="text-right">{row.credit ? money(row.credit, company.currencyCode ?? 'BDT') : '—'}</td><td className="text-right font-semibold">{money(row.balance, company.currencyCode ?? 'BDT')}</td></tr>; })}</tbody></table></div>}</section>}
  </div>;
}

function orderNotCancelled(status: string) { return status !== 'CANCELLED'; }
