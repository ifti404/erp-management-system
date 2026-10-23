'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import { AdminPageGuard } from '@/components/admin-page-guard';

type Category = { id: number; name: string; description: string | null };

export default function CategoriesPage() {
  return <AdminPageGuard><CategoriesManager /></AdminPageGuard>;
}

function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE}/categories`);
      if (!response.ok) throw new Error('Could not load categories.');
      setCategories(await response.json() as Category[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(() => loadCategories()); }, [loadCategories]);

  function clearForm() {
    setName('');
    setDescription('');
    setEditingId(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/categories${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!response.ok) throw new Error(await response.text() || 'Could not save category.');
      clearForm();
      setMessage(editingId ? 'Category updated.' : 'Category created.');
      await loadCategories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save category.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete the category “${category.name}”? Categories used by products may not be deleted.`)) return;
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/categories/${category.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await response.text() || 'Could not delete category.');
      setMessage('Category deleted.');
      await loadCategories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete category.');
    }
  }

  const filtered = categories.filter((category) =>
    `${category.name} ${category.description ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold tracking-tight">Categories</h1><p className="mt-2 text-muted-foreground">Organize products into clear groups.</p></header>
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{editingId ? 'Edit category' : 'Add category'}</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="text-sm font-medium">Description<input maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <div className="flex gap-2 md:col-span-2"><button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add category'}</button>{editingId !== null && <button type="button" onClick={clearForm} className="rounded-md border px-4 py-2 text-sm">Cancel</button>}</div>
      </form>
    </section>
    {message && <p role="status" className="rounded-md border bg-muted/30 p-3 text-sm">{message}</p>}
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b p-4"><h2 className="font-semibold">Category list ({filtered.length} of {categories.length})</h2><input aria-label="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm sm:max-w-md" /></div>
      {loading ? <p className="p-6 text-sm text-muted-foreground">Loading categories…</p> : filtered.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{categories.length ? 'No categories match your search.' : 'No categories yet. Add one above.'}</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-left"><tr><th className="p-3">Name</th><th className="p-3">Description</th><th className="p-3">Actions</th></tr></thead><tbody>{filtered.map((category) => <tr key={category.id} className="border-t"><td className="p-3 font-medium">{category.name}</td><td className="p-3">{category.description || '—'}</td><td className="p-3"><div className="flex gap-2"><button onClick={() => { setEditingId(category.id); setName(category.name); setDescription(category.description ?? ''); }} className="rounded-md border px-3 py-1.5">Edit</button><button onClick={() => void remove(category)} className="rounded-md border px-3 py-1.5 text-destructive">Delete</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
