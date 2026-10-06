'use client';

import { useEffect, useState } from 'react';

type Supplier = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchSuppliers = () => {
    fetch('http://localhost:8080/api/suppliers')
      .then((response) => response.json())
      .then((data) => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch suppliers:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const clearForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const supplierData = {
      name,
      phone,
      email: email || null,
      address: address || null,
    };

    const url =
      editingId === null
        ? 'http://localhost:8080/api/suppliers'
        : `http://localhost:8080/api/suppliers/${editingId}`;

    const method = editingId === null ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save supplier');
        return;
      }

      clearForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      alert('Failed to connect to the backend');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name);
    setPhone(supplier.phone);
    setEmail(supplier.email || '');
    setAddress(supplier.address || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this supplier?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/suppliers/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete supplier');
        return;
      }

      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      alert('Failed to connect to the backend');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Suppliers</h1>

      <p className="mt-2 text-muted-foreground">Manage your suppliers.</p>

      {/* Add / Edit Supplier Form */}
      <div className="mt-6 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          {editingId === null ? 'Add Supplier' : 'Edit Supplier'}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              {editingId === null ? 'Add Supplier' : 'Update Supplier'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-md border px-4 py-2 hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Supplier Table */}
      <div className="mt-8 rounded-lg border">
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading suppliers...</p>
        ) : suppliers.length === 0 ? (
          <p className="p-6 text-muted-foreground">No suppliers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b">
                    <td className="p-4">{supplier.name}</td>

                    <td className="p-4">{supplier.phone}</td>

                    <td className="p-4">{supplier.email || '-'}</td>

                    <td className="p-4">{supplier.address || '-'}</td>

                    <td className="p-4">
                      {new Date(supplier.createdAt).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="rounded-md border px-3 py-1 hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="rounded-md border px-3 py-1 hover:bg-muted"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
