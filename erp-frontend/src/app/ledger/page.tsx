'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

type RelatedOrder = { id: number; transactionId?: string | null };
type Payment = { id: number; paymentDate: string; amount: number; paymentMethod: string; status: string; notes?: string | null; salesOrder?: RelatedOrder | null; purchaseOrder?: RelatedOrder | null };
type Expense = { id: number; transactionId?: string | null; expenseDate: string; amount: number; paymentMethod: string; category: { name: string }; notes?: string | null; reference?: string | null };
type Row = { key: string; date: string; trxId: string; description: string; type: 'PURCHASE' | 'EXPENSE' | 'MISC' | 'INCOME'; direction: 'INCOME' | 'OUTFLOW'; amount: number; method: string; status: string };
const money = (amount: number) => `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LedgerPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([apiFetch(`${API_BASE}/payments`), apiFetch(`${API_BASE}/expenses`)]).then(async ([paymentResponse, expenseResponse]) => {
      if (!paymentResponse.ok || !expenseResponse.ok) throw new Error('Could not load the ledger. Check that you have report access.');
      const [payments, expenses] = await Promise.all([paymentResponse.json() as Promise<Payment[]>, expenseResponse.json() as Promise<Expense[]>]);
      if (!active) return;
      const paymentRows: Row[] = payments.filter((payment) => ['PAID', 'REFUNDED'].includes(payment.status)).map((payment) => {
        const purchase = Boolean(payment.purchaseOrder);
        const income = !purchase && payment.status !== 'REFUNDED';
        const reference = payment.purchaseOrder?.transactionId ?? payment.salesOrder?.transactionId;
        return { key: `payment-${payment.id}`, date: payment.paymentDate, trxId: `PAY-${String(payment.id).padStart(2, '0')}`, description: purchase ? `Payment for purchase ${reference ?? `#${payment.purchaseOrder?.id}`}` : payment.salesOrder ? `Receipt for sales ${reference ?? `#${payment.salesOrder.id}`}` : payment.status === 'REFUNDED' ? 'Miscellaneous refund' : 'Miscellaneous income', type: purchase ? 'PURCHASE' : payment.salesOrder ? 'INCOME' : 'MISC', direction: income ? 'INCOME' : 'OUTFLOW', amount: Number(payment.amount), method: payment.paymentMethod, status: payment.status };
      });
      const expenseRows: Row[] = expenses.map((expense) => ({ key: `expense-${expense.id}`, date: expense.expenseDate, trxId: expense.transactionId ?? `EXP-${String(expense.id).padStart(2, '0')}`, description: `${expense.category?.name ?? 'Expense'}${expense.notes ? ` · ${expense.notes}` : ''}`, type: 'EXPENSE', direction: 'OUTFLOW', amount: Number(expense.amount), method: expense.paymentMethod, status: 'RECORDED' }));
      setRows([...paymentRows, ...expenseRows].sort((a, b) => b.date.localeCompare(a.date)));
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load the ledger.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => rows.filter((row) => {
    const day = row.date.slice(0, 10);
    const matchesDate = (!from || day >= from) && (!to || day <= to);
    const matchesType = filter === 'ALL' || filter === 'INCOME' ? (filter === 'ALL' || row.direction === 'INCOME') : filter === 'OUTFLOW' ? row.direction === 'OUTFLOW' : row.type === filter;
    const matchesSearch = !search.trim() || `${row.trxId} ${row.description} ${row.method} ${row.status}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesDate && matchesType && matchesSearch;
  }), [rows, filter, from, to, search]);
  const income = filtered.filter((row) => row.direction === 'INCOME').reduce((sum, row) => sum + row.amount, 0);
  const outflow = filtered.filter((row) => row.direction === 'OUTFLOW').reduce((sum, row) => sum + row.amount, 0);

  return <div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">FINANCE</p><h1>Transaction ledger</h1><p>Review recorded payments and expenses in one filtered log.</p></div><div className="flex gap-2"><article className="panel px-4 py-3"><p className="text-xs text-muted-foreground">Income</p><p className="font-semibold text-emerald-700">{money(income)}</p></article><article className="panel px-4 py-3"><p className="text-xs text-muted-foreground">Cash outflows</p><p className="font-semibold text-rose-700">{money(outflow)}</p></article></div></header>
    {error && <p role="alert" className="alert-error">{error}</p>}
    <section className="panel overflow-hidden"><div className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-5"><label className="filter-field">Transaction type<select className="control" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All transactions</option><option value="PURCHASE">Purchases</option><option value="EXPENSE">Expenses</option><option value="MISC">Miscellaneous</option><option value="INCOME">Income only</option><option value="OUTFLOW">Cash outflows only</option></select></label><label className="filter-field">From<input type="date" className="control" value={from} onChange={(event) => setFrom(event.target.value)}/></label><label className="filter-field">To<input type="date" className="control" value={to} onChange={(event) => setTo(event.target.value)}/></label><label className="filter-field sm:col-span-2">Search<input className="control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, description, or method"/></label></div>
      {loading ? <p className="empty-state m-4">Loading transaction history…</p> : filtered.length ? <div className="overflow-x-auto"><table className="data-table min-w-[800px]"><thead><tr>{['Date', 'Trx ID', 'Description', 'Type', 'Amount', 'Method', 'Direction'].map((title) => <th key={title}>{title}</th>)}</tr></thead><tbody>{filtered.map((row) => <tr key={row.key}><td className="whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td><td className="font-semibold">{row.trxId}</td><td>{row.description}</td><td><span className="status-chip">{row.type === 'INCOME' ? 'Sales' : row.type === 'MISC' ? 'Miscellaneous' : row.type.toLowerCase()}</span></td><td className="font-semibold">{money(row.amount)}</td><td>{row.method}</td><td><span className={row.direction === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}>{row.direction === 'INCOME' ? 'Income' : 'Cash outflow'}</span></td></tr>)}</tbody></table></div> : <p className="empty-state m-4">No transactions match these filters.</p>}
    </section>
  </div>;
}
