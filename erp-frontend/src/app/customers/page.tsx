'use client';

import { useEffect, useState } from 'react';

type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchCustomers = () => {
    fetch('http://localhost:8080/api/customers')
      .then((response) => response.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch customers:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
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

    const customerData = {
      name,
      phone,
      email: email || null,
      address: address || null,
    };

    const url =
      editingId === null
        ? 'http://localhost:8080/api/customers'
        : `http://localhost:8080/api/customers/${editingId}`;

    const method = editingId === null ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save customer');
        return;
      }

      clearForm();
      fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to connect to the backend');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email || '');
    setAddress(customer.address || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this customer?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/customers/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete customer');
        return;
      }

      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to connect to the backend');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Customers</h1>

      <p className="mt-2 text-muted-foreground">Manage your customers.</p>

      {/* Add / Edit Customer Form */}
      <div className="mt-6 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          {editingId === null ? 'Add Customer' : 'Edit Customer'}
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
              {editingId === null ? 'Add Customer' : 'Update Customer'}
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

      {/* Customer Table */}
      <div className="mt-8 rounded-lg border">
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-muted-foreground">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b">
                    <td className="p-4">{customer.name}</td>

                    <td className="p-4">{customer.phone}</td>

                    <td className="p-4">{customer.email || '-'}</td>

                    <td className="p-4">{customer.address || '-'}</td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="rounded-md border px-3 py-1 hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(customer.id)}
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
