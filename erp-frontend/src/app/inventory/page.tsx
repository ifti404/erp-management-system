'use client';

import { useEffect, useState } from 'react';

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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/inventory')
      .then((response) => response.json())
      .then((data) => {
        setInventory(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch inventory:', error);
        setLoading(false);
      });
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

  const cardClass = 'rounded-lg border bg-card p-5 shadow-sm';

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>

        <p className="mt-2 text-muted-foreground">
          Track current stock levels and inventory status.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className={cardClass}>
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="mt-2 text-2xl font-bold">{totalProducts}</p>
        </div>

        <div className={cardClass}>
          <p className="text-sm text-muted-foreground">Total Units</p>
          <p className="mt-2 text-2xl font-bold">{totalUnits}</p>
        </div>

        <div className={cardClass}>
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="mt-2 text-2xl font-bold">{lowStockProducts}</p>
        </div>

        <div className={cardClass}>
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="mt-2 text-2xl font-bold">{outOfStockProducts}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Inventory List</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Current stock for all products.
          </p>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">SKU</th>
                  <th className="px-4 py-3 text-sm font-medium">Product</th>
                  <th className="px-4 py-3 text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-sm font-medium">
                    Reorder Level
                  </th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">
                    Last Updated
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((item) => {
                  let status = 'In Stock';

                  if (item.quantity === 0) {
                    status = 'Out of Stock';
                  } else if (item.quantity <= item.product.reorderLevel) {
                    status = 'Low Stock';
                  }

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {item.product.sku}
                      </td>

                      <td className="px-4 py-3 text-sm">{item.product.name}</td>

                      <td className="px-4 py-3 text-sm font-medium">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {item.product.reorderLevel}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-muted-foreground">
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
