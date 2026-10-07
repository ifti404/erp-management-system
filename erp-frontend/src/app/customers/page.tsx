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

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>

        <p className="mt-2 text-muted-foreground">
          Manage your customer information and contact details.
        </p>
      </div>

      {/* Add / Edit Customer Form */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">
            {editingId === null ? 'Add Customer' : 'Edit Customer'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingId === null
              ? 'Add a new customer to your records.'
              : 'Update the selected customer.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Customer name"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium">Phone</label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Phone number"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional email address"
              className={inputClass}
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium">Address</label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional address"
              className={inputClass}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingId === null ? 'Add Customer' : 'Update Customer'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Customer List */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Customer List</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {customers.length} customer
            {customers.length !== 1 ? 's' : ''} in records.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading customers...
          </p>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No customers found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add your first customer using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-sm font-medium">Phone</th>
                  <th className="px-4 py-3 text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-sm font-medium">Address</th>
                  <th className="px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {customer.name}
                    </td>

                    <td className="px-4 py-3 text-sm">{customer.phone}</td>

                    <td className="px-4 py-3 text-sm">
                      {customer.email || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {customer.address || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
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
