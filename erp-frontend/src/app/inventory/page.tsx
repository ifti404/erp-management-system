'use client';

import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';

const API = API_BASE;

type Inventory = {
  id: number;
  quantity: number;
  updatedAt: string;
  product: {
    id: number;
    sku: string;
    name: string;
    reorderLevel: number;
  };
};

type Movement = {
  id: number;
  product: { sku: string; name: string };
  movementType: string;
  quantityChange: number;
  quantityAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  notes: string | null;
  createdAt: string;
  actorUsername?: string | null;
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([apiFetch(`${API}/inventory`), apiFetch(`${API}/inventory-movements`)])
      .then(async ([inventoryResponse, movementResponse]) => {
        if (!inventoryResponse.ok || !movementResponse.ok) {
          throw new Error('Could not load inventory. Check that the backend is running.');
        }
        return Promise.all([
          inventoryResponse.json() as Promise<Inventory[]>,
          movementResponse.json() as Promise<Movement[]>,
        ]);
      })
      .then(([inventoryData, movementData]) => {
        if (active) {
          setInventory(inventoryData);
          setMovements(movementData);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load inventory.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const totalProducts = inventory.length;

  const totalUnits = inventory.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const lowStockProducts = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.product.reorderLevel,
  ).length;

  const outOfStockProducts = inventory.filter(
    (item) => item.quantity === 0,
  ).length;

  const filteredInventory = inventory.filter((item) =>
    [item.product.sku, item.product.name]
      .some((value) => value.toLowerCase().includes(searchTerm.trim().toLowerCase())),
  );

  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">STOCK CONTROL</p><h1>Inventory</h1><p>Review available stock and trace every recent change.</p></div><span className="count-pill">{loading ? 'Loading…' : `${totalProducts} products`}</span></header>

      {error && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="mt-2 text-2xl font-bold">{totalProducts}</p>
        </div>

        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Total Units</p>
          <p className="mt-2 text-2xl font-bold">{totalUnits}</p>
        </div>

        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="mt-2 text-2xl font-bold">{lowStockProducts}</p>
        </div>

        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="mt-2 text-2xl font-bold">{outOfStockProducts}</p>
        </div>
      </div>

      {/* Recent stock movements */}
      <section className="panel overflow-hidden">
        <div className="panel-heading">
          <h2 className="font-semibold">Recent Stock Movements</h2>
          <p className="mt-1 text-sm text-muted-foreground">The latest 200 stock changes from receipts, sales, returns, and manual adjustments.</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading stock history…</p>
        ) : movements.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No stock movements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left"><tr>
                <th>Time</th><th>Product</th><th>Reason</th><th className="text-right">Change</th><th className="text-right">Stock after</th><th>Reference</th><th>Recorded by</th>
              </tr></thead>
              <tbody>{movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="whitespace-nowrap text-muted-foreground">{new Date(movement.createdAt).toLocaleString()}</td>
                  <td><span className="font-medium">{movement.product.name}</span><span className="ml-2 text-muted-foreground">{movement.product.sku}</span></td>
                  <td><span className="status-chip">{movement.movementType.replaceAll('_', ' ')}</span></td>
                  <td className={`text-right font-semibold ${movement.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</td>
                  <td className="text-right">{movement.quantityAfter}</td>
                  <td>{movement.referenceType ? `${movement.referenceType.replaceAll('_', ' ')} #${movement.referenceId}` : '—'}</td>
                  <td>{movement.actorUsername || 'SYSTEM'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inventory Table */}
      <div className="panel overflow-hidden">
        <div className="panel-heading">
          <h2 className="font-semibold">Inventory List</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Showing {filteredInventory.length} of {inventory.length} products. Current stock for all products.
          </p>
          <input aria-label="Search inventory" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search product name or SKU" className="control mt-3 w-full sm:max-w-md" />
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading inventory...
          </p>
        ) : inventory.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No inventory records found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Inventory records will appear when products are added.
            </p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No products match “{searchTerm}”.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[680px]">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th>SKU</th><th>Product</th><th>Quantity</th><th>Reorder level</th><th>Status</th><th>Last updated</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.map((item) => {
                  let status = 'In Stock';

                  if (item.quantity === 0) {
                    status = 'Out of Stock';
                  } else if (item.quantity <= item.product.reorderLevel) {
                    status = 'Low Stock';
                  }

                  return (
                    <tr
                      key={item.id}
                      className=""
                    >
                      <td className="font-medium">
                        {item.product.sku}
                      </td>

                      <td>{item.product.name}</td>

                      <td className="font-medium">
                        {item.quantity}
                      </td>

                      <td>
                        {item.product.reorderLevel}
                      </td>

                      <td>
                        <span className="status-chip">
                          {status}
                        </span>
                      </td>

                      <td className="text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
