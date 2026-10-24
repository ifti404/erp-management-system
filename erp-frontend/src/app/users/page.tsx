'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminPageGuard } from '@/components/admin-page-guard';
import { API_BASE, apiFetch } from '@/lib/api';

type Role = { id: number; name: string };
type User = {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  role: Role;
};

async function errorMessage(response: Response, fallback: string) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    return parsed.message || fallback;
  } catch {
    return body || fallback;
  }
}

export default function UsersPage() {
  return <AdminPageGuard><UsersManager /></AdminPageGuard>;
}

function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roleSelections, setRoleSelections] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [userResponse, roleResponse] = await Promise.all([
        apiFetch(`${API_BASE}/users`), apiFetch(`${API_BASE}/roles`),
      ]);
      if (!userResponse.ok || !roleResponse.ok) throw new Error('Could not load users and roles.');
      const [userData, roleData] = await Promise.all([
        userResponse.json() as Promise<User[]>, roleResponse.json() as Promise<Role[]>,
      ]);
      setUsers(userData);
      setRoles(roleData);
      setRoleSelections(Object.fromEntries(userData.map((user) => [user.id, String(user.role.id)])));
      if (roleData.length) setRoleId((current) => current || String(roleData[0].id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load user records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(() => loadData()); }, [loadData]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(), passwordHash: password,
          fullName: fullName.trim(), email: email.trim() || null,
          phone: phone.trim() || null, active: true, role: { id: Number(roleId) },
        }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not create account.'));
      setFullName(''); setUsername(''); setPassword(''); setEmail(''); setPhone('');
      setMessage('Staff account created. Share the temporary password securely.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create account.');
    } finally {
      setSaving(false);
    }
  }

  async function changeActive(user: User) {
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/users/${user.id}/active`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not update account status.'));
      setMessage(`${user.username} is now ${user.active ? 'inactive' : 'active'}.`);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update account status.');
    }
  }

  async function changeRole(user: User) {
    const selectedRoleId = Number(roleSelections[user.id]);
    if (!selectedRoleId || selectedRoleId === user.role.id) return;
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/users/${user.id}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not update account role.'));
      setMessage(`Role updated for ${user.username}.`);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update account role.');
      await loadData();
    }
  }

  async function resetPassword(user: User) {
    const newPassword = window.prompt(`Enter a new password for ${user.username} (at least 8 characters):`);
    if (newPassword === null) return;
    if (newPassword.length < 8 || newPassword.length > 72) {
      setMessage('Password must be between 8 and 72 characters.');
      return;
    }
    try {
      const response = await apiFetch(`${API_BASE}/users/${user.id}/password`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not reset password.'));
      setMessage(`Password reset for ${user.username}. Share it securely.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reset password.');
    }
  }

  async function editDetails(user: User) {
    const nextName = window.prompt('Display name:', user.fullName); if (nextName === null) return;
    const nextUsername = window.prompt('Username:', user.username); if (nextUsername === null) return;
    const nextEmail = window.prompt('Email address (optional):', user.email ?? ''); if (nextEmail === null) return;
    const nextPhone = window.prompt('Phone number (optional):', user.phone ?? ''); if (nextPhone === null) return;
    setMessage('');
    try {
      const response = await apiFetch(`${API_BASE}/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nextUsername.trim(), fullName: nextName.trim(), email: nextEmail.trim() || null, phone: nextPhone.trim() || null, active: user.active, role: { id: user.role.id }, passwordHash: '' }) });
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not update user details.'));
      setMessage(`Details updated for ${user.username}.`); await loadData();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update user details.'); }
  }
  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Permanently delete the account for ${user.fullName} (${user.username})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setMessage('');
    setDeleteError('');
    setDeletingUserId(user.id);
    try {
      const response = await apiFetch(`${API_BASE}/users/${user.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(await errorMessage(response, 'Could not delete this account.'));
      }
      setMessage(`Account ${user.username} was deleted.`);
      await loadData();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete this account.');
    } finally {
      setDeletingUserId(null);
    }
  }

  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.fullName} ${user.email ?? ''} ${user.role.name}`
      .toLowerCase().includes(search.trim().toLowerCase()),
  );

  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold tracking-tight">Staff accounts</h1><p className="mt-2 text-muted-foreground">Create sign-ins, assign roles, reset passwords, and turn access on or off. Public sign-up requests appear inactive until you approve them.</p></header>
    {message && <p role="status" className="rounded-md border bg-muted/30 p-3 text-sm">{message}</p>}
    {deleteError && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{deleteError}</p>}
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Add staff account</h2>
      <form onSubmit={createUser} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium">Full name<input required maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="text-sm font-medium">Username<input required maxLength={50} autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="text-sm font-medium">Temporary password<input required minLength={8} maxLength={72} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="text-sm font-medium">Email<input type="email" maxLength={100} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="text-sm font-medium">Phone<input maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="text-sm font-medium">Role<select required value={roleId} onChange={(event) => setRoleId(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2"><option value="">Choose role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <div className="sm:col-span-2 lg:col-span-3"><button disabled={saving || roles.length === 0} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Creating…' : 'Create account'}</button></div>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Passwords are stored as secure hashes. The app never displays a saved password.</p>
    </section>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b p-4"><h2 className="font-semibold">Accounts ({filteredUsers.length} of {users.length})</h2><input aria-label="Search staff accounts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, email, or role" className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm sm:max-w-md" /></div>
      {loading ? <p className="p-6 text-sm text-muted-foreground">Loading accounts…</p> : filteredUsers.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{users.length ? 'No accounts match your search.' : 'No accounts found.'}</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-left"><tr><th className="p-3">Name</th><th className="p-3">Username</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id} className="border-t"><td className="p-3"><div className="font-medium">{user.fullName}</div><div className="text-xs text-muted-foreground">{user.email || user.phone || 'No contact details'}</div></td><td className="p-3">{user.username}</td><td className="p-3"><div className="flex gap-2"><select aria-label={`Role for ${user.username}`} value={roleSelections[user.id] ?? String(user.role.id)} onChange={(event) => setRoleSelections((current) => ({ ...current, [user.id]: event.target.value }))} className="rounded-md border bg-background px-2 py-1">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button onClick={() => void changeRole(user)} disabled={Number(roleSelections[user.id]) === user.role.id} className="rounded-md border px-2 py-1 disabled:opacity-50">Save</button></div></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>{user.active ? 'Active' : 'Inactive'}</span></td><td className="p-3"><div className="flex flex-wrap gap-2"><button onClick={() => void editDetails(user)} className="rounded-md border px-2.5 py-1.5">Edit details</button><button onClick={() => void changeActive(user)} className="rounded-md border px-2.5 py-1.5">{user.active ? 'Deactivate' : 'Activate'}</button><button onClick={() => void resetPassword(user)} className="rounded-md border px-2.5 py-1.5">Reset password</button><button onClick={() => void deleteUser(user)} disabled={deletingUserId === user.id} className="rounded-md border border-destructive/40 px-2.5 py-1.5 text-destructive hover:bg-destructive/5 disabled:opacity-50">{deletingUserId === user.id ? 'Deleting…' : 'Delete'}</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
