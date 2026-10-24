'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminPageGuard } from '@/components/admin-page-guard';
import { API_BASE, apiFetch } from '@/lib/api';

type Role = { id: number; name: string; permissions: string[] };
const permissionModules = [
  ['PRODUCTS', 'Products', true], ['INVENTORY', 'Inventory', true], ['CATEGORIES', 'Product categories', true],
  ['CUSTOMERS', 'Customers', true], ['SUPPLIERS', 'Suppliers', true], ['SALES', 'Sales orders', true],
  ['RETURNS', 'Sales returns', true], ['PURCHASES', 'Purchase orders', true], ['PAYMENTS', 'Payments', true],
  ['EXPENSES', 'Expenses', true], ['REPORTS', 'Reports', false], ['STATEMENTS', 'Account statements', false],
  ['SETTINGS', 'Company settings', true],
] as const;

export default function RolesPage() {
  return <AdminPageGuard><RolesManager /></AdminPageGuard>;
}

function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRoles = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE}/roles`);
      if (!response.ok) throw new Error('Could not load roles.');
      setRoles(await response.json() as Role[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(() => loadRoles()); }, [loadRoles]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/roles${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim().toUpperCase(), permissions }),
      });
      if (!response.ok) throw new Error(await response.text() || 'Could not save role.');
      setName(''); setEditingId(null); setPermissions([]);
      setMessage(editingId ? 'Role updated.' : 'Role created.');
      await loadRoles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save role.');
    }
  }

  function togglePermission(permission: string, enabled: boolean) {
    const [module, action] = permission.split('_');
    setPermissions((current) => {
      const next = new Set(current);
      if (enabled) next.add(permission); else next.delete(permission);
      if (action === 'MANAGE' && enabled) next.add(`${module}_VIEW`);
      if (action === 'VIEW' && !enabled) next.delete(`${module}_MANAGE`);
      return [...next];
    });
  }

  async function remove(role: Role) {
    if (!window.confirm(`Delete the ${role.name} role?`)) return;
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/roles/${role.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await response.text() || 'Could not delete role. It may still be assigned to staff.');
      setMessage('Role deleted.');
      await loadRoles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete role.');
    }
  }

  const filteredRoles = roles.filter((role) => role.name.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold tracking-tight">Roles</h1><p className="mt-2 text-muted-foreground">Choose which sections each staff role can view and where it can make changes. ADMIN always has full access.</p></header>
    {message && <p role="status" className="rounded-md border bg-muted/30 p-3 text-sm">{message}</p>}
    <section className="rounded-lg border bg-card p-5 shadow-sm"><h2 className="text-lg font-semibold">{editingId ? 'Edit role access' : 'Add role'}</h2><p className="mt-1 text-sm text-muted-foreground">View allows opening a section. Manage allows adding, changing, or removing records there.</p><form onSubmit={submit} className="mt-4 space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><input required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: SALES" className="w-full rounded-md border bg-background px-3 py-2 sm:max-w-sm" /><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{editingId ? 'Save role access' : 'Create role'}</button>{editingId !== null && <button type="button" onClick={() => { setEditingId(null); setName(''); setPermissions([]); }} className="rounded-md border px-4 py-2 text-sm">Cancel</button>}</div>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/40 text-left"><tr><th className="p-3">Section</th><th className="p-3">View</th><th className="p-3">Manage</th></tr></thead><tbody>{permissionModules.map(([key, label, canManage]) => <tr key={key} className="border-t"><td className="p-3 font-medium">{label}</td><td className="p-3"><input type="checkbox" aria-label={`Allow viewing ${label}`} checked={permissions.includes(`${key}_VIEW`)} onChange={(event) => togglePermission(`${key}_VIEW`, event.target.checked)} /></td><td className="p-3">{canManage ? <input type="checkbox" aria-label={`Allow managing ${label}`} checked={permissions.includes(`${key}_MANAGE`)} onChange={(event) => togglePermission(`${key}_MANAGE`, event.target.checked)} /> : <span className="text-xs text-muted-foreground">View only</span>}</td></tr>)}</tbody></table></div>
    </form></section>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="border-b p-4"><h2 className="font-semibold">Roles ({filteredRoles.length} of {roles.length})</h2><input aria-label="Search roles" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles" className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm sm:max-w-md" /></div>{loading ? <p className="p-6 text-sm text-muted-foreground">Loading roles…</p> : filteredRoles.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No roles found.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-left"><tr><th className="p-3">Role</th><th className="p-3">Access summary</th><th className="p-3">Actions</th></tr></thead><tbody>{filteredRoles.map((role) => <tr key={role.id} className="border-t"><td className="p-3 font-medium">{role.name}</td><td className="p-3 text-muted-foreground">{role.name === 'ADMIN' ? 'Full access' : `${(role.permissions ?? []).filter((permission) => permission.endsWith('_VIEW')).length} sections viewable · ${(role.permissions ?? []).filter((permission) => permission.endsWith('_MANAGE')).length} manageable`}</td><td className="p-3"><div className="flex gap-2">{role.name === 'ADMIN' ? <span className="px-2 py-1 text-xs text-muted-foreground">Protected role</span> : <><button onClick={() => { setEditingId(role.id); setName(role.name); setPermissions(role.permissions ?? []); }} className="rounded-md border px-3 py-1.5">Edit access</button><button onClick={() => void remove(role)} className="rounded-md border px-3 py-1.5 text-destructive">Delete</button></>}</div></td></tr>)}</tbody></table></div>}</section>
  </div>;
}
