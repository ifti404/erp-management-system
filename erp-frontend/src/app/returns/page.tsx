'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

type Order = { id: number; status: string; customer?: { name: string } };
type SalesItem = { id: number; salesOrder: { id: number }; product: { name: string; sku: string }; quantity: number; unitPrice: number };
type ReturnItem = { salesItemId: number; productName: string; sku: string; quantity: number; restock: boolean; unitPrice: number; lineTotal: number };
type SalesReturn = { id: number; salesOrderId: number; customerName: string; reason: string; settlementType: 'REFUND' | 'BALANCE_ADJUSTMENT' | 'STORE_CREDIT'; settlementStatus: string; returnAmount: number; refundAmount: number; createdAt: string; createdBy: string; items: ReturnItem[] };
type Inventory = { quantity: number; product: { name: string; sku: string; reorderLevel: number } };

const money = (amount: number) => `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
async function errorMessage(response: Response, fallback: string) {
  const body = await response.text();
  try { return (JSON.parse(body) as { message?: string }).message || fallback; } catch { return body || fallback; }
}

export default function ReturnsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<SalesItem[]>([]);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [restock, setRestock] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const responses = await Promise.all(['sales-orders', 'sales-items', 'sales-returns', 'inventory'].map((path) => apiFetch(`${API_BASE}/${path}`)));
      if (responses.some((response) => !response.ok)) throw new Error('Could not load return records. Check the backend and try again.');
      const [orderData, itemData, returnData, inventoryData] = await Promise.all(responses.map((response) => response.json()));
      setOrders(orderData as Order[]); setItems(itemData as SalesItem[]); setReturns(returnData as SalesReturn[]); setInventory(inventoryData as Inventory[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load return records.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { Promise.resolve().then(() => loadData()); }, [loadData]);

  const selectedOrder = orders.find((order) => order.id === Number(orderId));
  const orderItems = items.filter((item) => item.salesOrder.id === Number(orderId));
  const returnedQuantity = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const entry of returns) for (const line of entry.items) totals[line.salesItemId] = (totals[line.salesItemId] ?? 0) + line.quantity;
    return totals;
  }, [returns]);
  const returnableItems = orderItems.map((item) => ({ ...item, remaining: item.quantity - (returnedQuantity[item.id] ?? 0) }));
  const expectedAmount = returnableItems.reduce((sum, item) => sum + (Number(quantities[item.id] || 0) * Number(item.unitPrice)), 0);
  const lowStockCount = inventory.filter((entry) => entry.quantity <= entry.product.reorderLevel).length;

  async function createReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setSaving(true);
    const lines = returnableItems.filter((item) => Number(quantities[item.id] || 0) > 0)
      .map((item) => ({ salesItemId: item.id, quantity: Number(quantities[item.id]), restock: restock[item.id] ?? true }));
    try {
      const response = await apiFetch(`${API_BASE}/sales-returns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salesOrderId: Number(orderId), reason: reason.trim(), items: lines }) });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not save this return.'));
      setMessage(`Return recorded. Returned item value: ${money(expectedAmount)}. Any cash refund due is calculated from the amount already paid.`);
      setOrderId(''); setReason(''); setQuantities({}); setRestock({});
      await loadData();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this return.'); }
    finally { setSaving(false); }
  }

  async function settle(entry: SalesReturn) {
    const action = 'confirm that the refund was paid';
    if (!window.confirm(`Please ${action} for ${money(Number(entry.refundAmount))}?`)) return;
    setError(''); setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/sales-returns/${entry.id}/settlement`, { method: 'PATCH' });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not update settlement status.'));
      setMessage('Return settlement marked complete.'); await loadData();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update settlement status.'); }
  }

  return <div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">SALES & CUSTOMER CARE</p><h1>Returns and refunds</h1><p>Record returned quantities and restocking. The customer balance is reduced by returned items; cash is refunded only when their payments exceed the remaining order balance.</p></div><div className="count-pill">{lowStockCount} low-stock items</div></header>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    <section className="panel p-5">
      <h2 className="text-lg font-semibold">Record a return</h2>
      <p className="mt-1 text-sm text-muted-foreground">Only delivered orders are eligible. Return quantities cannot exceed the original quantity minus earlier returns.</p>
      {loading ? <p className="mt-5 text-sm text-muted-foreground">Loading orders…</p> : <form onSubmit={createReturn} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Delivered order<select required value={orderId} onChange={(event) => { setOrderId(event.target.value); setQuantities({}); }} className="control mt-1"><option value="">Choose a delivered order</option>{orders.filter((order) => order.status.toUpperCase() === 'DELIVERED').map((order) => <option key={order.id} value={order.id}>Order #{order.id} · {order.customer?.name ?? 'Customer'}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2">Reason<input required maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="For example: damaged on arrival" className="control mt-1" /></label>
        </div>
        {selectedOrder && <div className="overflow-x-auto rounded-xl border"><table className="data-table min-w-[680px]"><thead><tr><th>Product</th><th>Sold</th><th>Previously returned</th><th>Returning now</th><th>Restock</th><th>Amount</th></tr></thead><tbody>{returnableItems.map((item) => <tr key={item.id}><td><div className="font-medium">{item.product.name}</div><div className="text-xs text-muted-foreground">{item.product.sku}</div></td><td>{item.quantity}</td><td>{returnedQuantity[item.id] ?? 0}</td><td><input aria-label={`Return quantity for ${item.product.name}`} type="number" min="0" max={item.remaining} step="1" value={quantities[item.id] ?? ''} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))} className="control w-24" /></td><td><label className="inline-flex items-center gap-2"><input type="checkbox" checked={restock[item.id] ?? true} onChange={(event) => setRestock((current) => ({ ...current, [item.id]: event.target.checked }))} />Yes</label></td><td>{money(Number(quantities[item.id] || 0) * Number(item.unitPrice))}</td></tr>)}{returnableItems.length === 0 && <tr><td colSpan={6} className="empty-state">No item quantities remain eligible for return.</td></tr>}</tbody></table></div>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Returned item value: <strong>{money(expectedAmount)}</strong></p><button type="submit" disabled={saving || !selectedOrder || expectedAmount <= 0} className="button-primary">{saving ? 'Saving…' : 'Record return'}</button></div>
      </form>}
    </section>
    <section className="panel overflow-hidden"><div className="panel-heading"><div><h2>Return history</h2><p>Returned value reduces the balance; cash refunds are tracked separately.</p></div><span className="count-pill">{returns.length} records</span></div>
      {loading ? <p className="p-5 text-sm text-muted-foreground">Loading returns…</p> : returns.length === 0 ? <p className="empty-state">No returns recorded yet.</p> : <div className="overflow-x-auto"><table className="data-table min-w-[900px]"><thead><tr><th>Return</th><th>Order / customer</th><th>Items</th><th>Reason</th><th>Returned value</th><th>Cash refund</th><th>Status</th><th>Recorded</th><th>Action</th></tr></thead><tbody>{returns.map((entry) => <tr key={entry.id}><td>RET-{entry.id}</td><td>#{entry.salesOrderId}<div className="text-xs text-muted-foreground">{entry.customerName}</div></td><td>{entry.items.map((item) => `${item.quantity} × ${item.productName}${item.restock ? ' (restocked)' : ''}`).join(', ')}</td><td>{entry.reason}</td><td className="font-semibold">{money(Number(entry.returnAmount))}</td><td>{money(Number(entry.refundAmount))}</td><td>{entry.settlementType === 'BALANCE_ADJUSTMENT' ? 'Balance reduced' : entry.settlementType === 'STORE_CREDIT' ? 'Legacy credit · not redeemable' : entry.settlementStatus}</td><td>{new Date(entry.createdAt).toLocaleDateString()}</td><td>{entry.settlementType === 'REFUND' && entry.settlementStatus === 'PENDING' ? <button type="button" onClick={() => void settle(entry)} className="button-secondary">Mark refund paid</button> : '—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
