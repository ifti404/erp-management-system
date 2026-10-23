'use client';

import { useEffect, useState } from 'react';
import { AdminPageGuard } from '@/components/admin-page-guard';
import { API_BASE, apiFetch } from '@/lib/api';

type AuditEvent = { id: number; createdAt: string; actorUsername: string; action: string; entityType: string; entityId: number | null; details: string };
const input = 'rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30';

export default function AuditPage() {
  const [rows, setRows] = useState<AuditEvent[]>([]);
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [type, setType] = useState(''); const [action, setAction] = useState(''); const [actor, setActor] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ limit: '500' });
    if (from) params.set('from', from); if (to) params.set('to', to);
    if (type) params.set('type', type); if (action.trim()) params.set('action', action.trim()); if (actor.trim()) params.set('actor', actor.trim());
    apiFetch(`${API_BASE}/audit-logs?${params}`).then(async (response) => {
      if (!response.ok) throw new Error('Could not load audit history.');
      return await response.json() as AuditEvent[];
    }).then((data) => { if (active) { setRows(data); setError(''); } }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load audit history.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [action, actor, from, to, type]);

  const exportCsv = () => {
    const lines = [['Date', 'User', 'Action', 'Record type', 'Record ID', 'Details'], ...rows.map((row) => [row.createdAt, row.actorUsername, row.action, row.entityType, row.entityId ?? '', row.details ?? ''])]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', lines], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'gamma-erp-audit-history.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return <AdminPageGuard><div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">CONTROL & REVIEW</p><h1>Audit history</h1><p>Review important changes made to orders, payments, stock, users, and setup.</p></div><button onClick={exportCsv} disabled={!rows.length} className="button-primary">Export history</button></header>
    <section className="panel p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3">
      <label className="filter-field">From<input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} /></label>
      <label className="filter-field">To<input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} /></label>
      <label className="filter-field">Record type<select value={type} onChange={(e) => setType(e.target.value)} className={input}><option value="">All records</option>{['SALES_ORDER', 'SALES_RETURN', 'PURCHASE_ORDER', 'PAYMENT', 'INVENTORY', 'PRODUCT', 'CUSTOMER', 'SUPPLIER', 'CATEGORY', 'USER', 'ROLE', 'COMPANY_SETTINGS'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
      <label className="filter-field">Action<input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. UPDATED" className={input}/></label>
      <label className="filter-field min-w-44">User<input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Search user" className={input} /></label>
      <p className="ml-auto text-sm text-muted-foreground">Showing up to 500 entries</p>
    </div></section>
    {error && <p role="alert" className="alert-error">{error}</p>}
    <section className="panel overflow-hidden"><div className="panel-heading"><div><h2>Recorded changes</h2><p>Entries are created by successful business actions and cannot be edited in the app.</p></div><span className="count-pill">{rows.length} entries</span></div>
      {loading ? <p className="empty-state">Loading history…</p> : !rows.length ? <p className="empty-state">No audit entries match these filters.</p> : <div className="overflow-x-auto"><table className="data-table min-w-[760px]"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td className="whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td><td className="font-medium">{row.actorUsername}</td><td><span className="status-chip">{row.action.replaceAll('_', ' ')}</span></td><td>{row.entityType.replaceAll('_', ' ')}{row.entityId ? ` #${row.entityId}` : ''}</td><td className="max-w-lg whitespace-normal text-muted-foreground">{row.details}</td></tr>)}</tbody></table></div>}
    </section>
  </div></AdminPageGuard>;
}
