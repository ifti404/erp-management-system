'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

type Category = { id: number; name: string; description?: string; active: boolean };
type Expense = { id: number; category: Category; amount: number; expenseDate: string; paymentMethod: string; reference?: string; notes?: string; createdBy: string };
function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
const money = (value: number) => `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function refresh() {
    const [expenseResponse, categoryResponse] = await Promise.all([apiFetch(`${API_BASE}/expenses`), apiFetch(`${API_BASE}/expense-categories`)]);
    if (!expenseResponse.ok || !categoryResponse.ok) throw new Error('Could not load expenses. Please refresh and try again.');
    const [expenseData, categoryData] = await Promise.all([expenseResponse.json(), categoryResponse.json()]);
    setRows(expenseData); setCategories(categoryData.filter((item: Category) => item.active));
    if (!categoryId && categoryData.length) setCategoryId(String(categoryData.find((item: Category) => item.active)?.id ?? ''));
  }
  useEffect(() => {
    let active = true;
    Promise.all([apiFetch(`${API_BASE}/expenses`), apiFetch(`${API_BASE}/expense-categories`)]).then(async ([expenseResponse, categoryResponse]) => {
      if (!expenseResponse.ok || !categoryResponse.ok) throw new Error('Could not load expenses. Please refresh and try again.');
      return Promise.all([expenseResponse.json(), categoryResponse.json()]);
    }).then(([expenseData, categoryData]) => {
      if (!active) return;
      setRows(expenseData as Expense[]); setCategories((categoryData as Category[]).filter((item) => item.active));
      const firstActive = (categoryData as Category[]).find((item) => item.active);
      if (firstActive) setCategoryId(String(firstActive.id));
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load expenses.'); });
    return () => { active = false; };
  }, []);
  const filtered = useMemo(() => rows.filter((row) => (!from || row.expenseDate >= from) && (!to || row.expenseDate <= to) && `${row.category.name} ${row.reference ?? ''} ${row.notes ?? ''} ${row.createdBy}`.toLowerCase().includes(search.trim().toLowerCase())), [rows, from, to, search]);
  const total = filtered.reduce((sum, row) => sum + Number(row.amount), 0);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const response = await apiFetch(`${API_BASE}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: { id: Number(categoryId) }, amount: Number(amount), expenseDate: date, paymentMethod: method, reference: reference || null, notes: notes || null }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Could not save this expense.'); }
      setAmount(''); setReference(''); setNotes(''); setDate(today()); setNotice('Expense saved.'); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this expense.'); }
    finally { setBusy(false); }
  }
  async function addCategory(event: FormEvent) {
    event.preventDefault(); if (!newCategory.trim()) return; setError('');
    try {
      const response = await apiFetch(`${API_BASE}/expense-categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory.trim(), active: true }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Could not add category.'); }
      setNewCategory(''); await refresh(); setNotice('Expense category added.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not add category.'); }
  }
  async function remove(id: number) {
    if (!window.confirm('Delete this expense record?')) return; setError('');
    try { const response = await apiFetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('Could not delete this expense.'); await refresh(); setNotice('Expense deleted.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete expense.'); }
  }
  return <div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">FINANCE & OPERATIONS</p><h1>Expenses</h1><p>Track everyday spending and organize it by category.</p></div><article className="panel min-w-44 px-5 py-3"><p className="text-xs text-muted-foreground">Filtered total</p><p className="mt-1 text-xl font-semibold">{money(total)}</p></article></header>
    {error && <p role="alert" className="alert-error">{error}</p>}{notice && <p role="status" className="alert-success">{notice}</p>}
    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
      <form onSubmit={submit} className="panel grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><h2 className="font-semibold">Record an expense</h2><p className="mt-1 text-sm text-muted-foreground">The date defaults to today. You can edit it if needed.</p></div>
        <label className="filter-field">Category<select className="control" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Choose category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="filter-field">Amount<input className="control" type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
        <label className="filter-field">Expense date<input className="control" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="filter-field">Payment method<select className="control" value={method} onChange={(e) => setMethod(e.target.value)}><option>CASH</option><option>BANK</option><option>MOBILE</option><option>CARD</option></select></label>
        <label className="filter-field">Reference<input className="control" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt or transaction ID" /></label>
        <label className="filter-field">Notes<input className="control" maxLength={255} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details" /></label>
        <div className="sm:col-span-2"><button className="button-primary" disabled={busy || !categories.length}>{busy ? 'Saving…' : 'Save expense'}</button>{!categories.length && <p className="mt-2 text-xs text-muted-foreground">Add an expense category to start recording expenses.</p>}</div>
      </form>
      <section className="panel p-5"><h2 className="font-semibold">Expense categories</h2><p className="mt-1 text-sm text-muted-foreground">Add categories that match how you track spending.</p><form onSubmit={addCategory} className="mt-4 flex gap-2"><input className="control" required maxLength={100} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Internet"/><button className="button-secondary shrink-0">Add</button></form><div className="mt-4 flex flex-wrap gap-2">{categories.map((item) => <span key={item.id} className="count-pill">{item.name}</span>)}</div></section>
    </section>
    <section className="panel overflow-hidden"><div className="panel-heading"><div><h2>Expense history</h2><p>{filtered.length} record{filtered.length === 1 ? '' : 's'} in this view</p></div></div><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="filter-field">Search<input className="control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Category, note, reference" /></label><label className="filter-field">From<input className="control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label className="filter-field">To<input className="control" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label><div className="flex items-end text-sm text-muted-foreground">Total: <strong className="ml-1 text-foreground">{money(total)}</strong></div></div>
      {filtered.length ? <div className="overflow-x-auto"><table className="data-table min-w-[760px]"><thead><tr>{['Date', 'Category', 'Amount', 'Method', 'Reference', 'Notes', ''].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td>{row.expenseDate}</td><td>{row.category.name}</td><td className="font-semibold">{money(Number(row.amount))}</td><td>{row.paymentMethod}</td><td>{row.reference || '—'}</td><td>{row.notes || '—'}</td><td><button className="text-xs font-medium text-destructive hover:underline" onClick={() => void remove(row.id)}>Delete</button></td></tr>)}</tbody></table></div> : <p className="empty-state m-4">No expenses match these filters yet.</p>}
    </section>
  </div>;
}
