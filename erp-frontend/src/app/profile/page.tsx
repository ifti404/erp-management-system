'use client';

import { useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Camera, Mail, Phone, Shield, UserRound } from 'lucide-react';

type Profile = { username: string; fullName: string; email?: string | null; phone?: string | null; photoData?: string | null; roles: string[] };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => { apiFetch(`${API_BASE}/auth/me`).then((r) => r.ok ? r.json() : null).then(setProfile).catch(() => {}); }, []);
  if (!profile) return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
  const role = (profile.roles?.[0] ?? 'Staff').replace(/^ROLE_/, '');
  return <div className="page-stack max-w-3xl"><header className="page-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p>Your account details and access level.</p></div></header><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-teal-100 text-teal-900">{profile.photoData ? <img src={profile.photoData} alt="Profile" className="size-full object-cover"/> : <UserRound className="size-9"/>}</span><div><h2 className="text-xl font-semibold">{profile.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p><span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><Shield className="size-3.5"/>{role}</span></div></div><div className="mt-7 grid gap-4 border-t border-border pt-5 sm:grid-cols-2"><div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground"/><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{profile.email || 'Not set'}</p></div></div><div className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground"/><div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm">{profile.phone || 'Not set'}</p></div></div></div><Link href="/user-settings" className="button-primary mt-6 inline-flex">Edit user settings</Link></section></div>;
}
