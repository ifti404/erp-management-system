'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, AUTH_STORAGE_KEY, fetchWithCsrf } from '@/lib/api';
import { Boxes, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react';

type Mode = 'signin' | 'signup';
const inputClass = 'control min-h-12 rounded-xl px-4 text-base';

async function responseMessage(response: Response, fallback: string) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    return parsed.message || fallback;
  } catch {
    return body || fallback;
  }
}

function basicToken(identifier: string, password: string) {
  const bytes = new TextEncoder().encode(`${identifier}:${password}`);
  return window.btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setError('');
    setNotice('');
  }

  async function signIn() {
    const token = basicToken(identifier.trim(), password);
    const auth = { headers: { Authorization: `Basic ${token}` }, credentials: 'include' as RequestCredentials };
    const response = await fetch(`${API_BASE}/auth/me`, auth);
    if (!response.ok) {
      if (response.status === 401) throw new Error('Username or email and password do not match, or the account is waiting for activation.');
      throw new Error('Could not connect to the ERP server. Check that it is running.');
    }
    const previousSession = await fetchWithCsrf(`${API_BASE}/auth/logout`, { ...auth, method: 'POST' });
    if (!previousSession.ok) throw new Error('Could not replace the old sign-in. Please try again.');
    const sessionResponse = await fetchWithCsrf(`${API_BASE}/auth/session`, {
      method: 'POST', headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rememberDevice }), credentials: 'include',
    });
    if (!sessionResponse.ok) throw new Error('Signed in, but the secure browser session could not be created. Please try again.');
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    router.replace('/');
  }

  async function signUp() {
    const response = await fetchWithCsrf(`${API_BASE}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), phone: phone.trim(), email: email.trim(), password }),
    });
    if (!response.ok) throw new Error(await responseMessage(response, 'Could not send the sign-up request.'));
    const result = await response.json() as { message?: string };
    setPassword('');
    setNotice(result.message || 'Your sign-up request was sent. An administrator must activate your account before you can sign in.');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signin') await signIn();
      else await signUp();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--workspace)] px-4 py-10 sm:px-6">
    <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-24 size-80 rounded-full bg-teal-200/40 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-16 size-96 rounded-full bg-cyan-100/70 blur-3xl" />
    <section className="relative w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(15,70,75,0.28)] backdrop-blur sm:p-9">
      <div className="mb-7 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-900/10"><Boxes className="size-6"/></span><div><p className="text-xs font-bold tracking-[0.16em] text-teal-700">GAMMA ERP</p><p className="mt-0.5 text-sm text-muted-foreground">Your business workspace</p></div></div>
      <div><p className="eyebrow">WELCOME</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{mode === 'signin' ? 'Good to see you' : 'Create your account'}</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode === 'signin' ? 'Sign in with your username or email address.' : 'Send your details to the business administrator for account activation.'}</p></div>

      <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted/70 p-1" role="group" aria-label="Account access">
        <button type="button" aria-pressed={mode === 'signin'} onClick={() => chooseMode('signin')} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'signin' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Sign in</button>
        <button type="button" aria-pressed={mode === 'signup'} onClick={() => chooseMode('signup')} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Sign up</button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'signin' ? <>
          <label className="filter-field text-xs">Username or email<input autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com" className={inputClass}/></label>
          <label className="filter-field text-xs">Password<span className="relative block"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-12`}/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{showPassword ? <EyeOff className="size-4" aria-hidden="true"/> : <Eye className="size-4" aria-hidden="true"/>}</button></span></label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" checked={rememberDevice} onChange={(event) => setRememberDevice(event.target.checked)} className="mt-0.5 accent-teal-700"/><span>Keep me signed in on this device for up to 30 days</span></label>
        </> : <>
          <label className="filter-field text-xs">Username<input autoComplete="username" minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" required value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass}/></label>
          <label className="filter-field text-xs">Phone number<input type="tel" autoComplete="tel" maxLength={20} required value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass}/></label>
          <label className="filter-field text-xs">Email address<input type="email" autoComplete="email" maxLength={100} required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass}/></label>
          <label className="filter-field text-xs">Password<input type="password" autoComplete="new-password" minLength={10} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass}/><span className="text-[11px] font-normal">Use 10–72 characters.</span></label>
          <div className="flex gap-2 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs leading-relaxed text-teal-900"><LockKeyhole className="mt-0.5 size-4 shrink-0"/><p>Your account stays inactive until an administrator approves it. Your password is stored as a secure hash.</p></div>
        </>}

        {error && <p role="alert" className="alert-error">{error}</p>}
        {notice && <p role="status" className="alert-success flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0"/>{notice}</p>}
        <button type="submit" disabled={busy} className="button-primary min-h-12 w-full rounded-xl text-sm">{busy ? (mode === 'signin' ? 'Signing in…' : 'Sending request…') : (mode === 'signin' ? 'Sign in' : 'Send sign-up request')}</button>
      </form>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">Access is managed by your business administrator.</p>
    </section>
  </main>;
}
