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

  return (
    <div>
      <h1 className="text-3xl font-bold">Inventory</h1>

      <p className="mt-2 text-muted-foreground">Track current stock levels.</p>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="mt-2 text-2xl font-bold">{totalProducts}</p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">Total Units</p>
          <p className="mt-2 text-2xl font-bold">{totalUnits}</p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="mt-2 text-2xl font-bold">{lowStockProducts}</p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="mt-2 text-2xl font-bold">{outOfStockProducts}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="mt-8 rounded-lg border">
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading inventory...</p>
        ) : inventory.length === 0 ? (
          <p className="p-6 text-muted-foreground">
            No inventory records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Reorder Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
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
                    <tr key={item.id} className="border-b">
                      <td className="p-4">{item.product.sku}</td>

                      <td className="p-4">{item.product.name}</td>

                      <td className="p-4">{item.quantity}</td>

                      <td className="p-4">{item.product.reorderLevel}</td>

                      <td className="p-4">{status}</td>

                      <td className="p-4">
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
