import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { Logo, LangToggle } from './ui.jsx';

const NAV = {
  patient: [['/app', 'Overview'], ['/app/check', 'New symptom check'], ['/app/book', 'Appointments']],
  doctor: [['/doctor', 'Triage queue']],
  admin: [['/admin', 'Analytics'], ['/doctor', 'Triage queue']],
};

export function PublicNav() {
  const { user } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const home = user ? (user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/app') : '/signin';
  return (
    <header className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <div className="flex items-center justify-between py-5">
        <Link to="/" aria-label="MediTriage home"><Logo /></Link>
        <nav className="hidden items-center gap-3 md:flex">
          <a href="/#how" className="mut px-3 font-medium">How it works</a>
          <a href="/#features" className="mut px-3 font-medium">Features</a>
          <LangToggle />
          <Link className="btn btn-outline" to={home}>{user ? 'Open app' : t('Sign in')}</Link>
          {!user && <Link className="btn" to="/signup">{t('Sign up')}</Link>}
        </nav>
        <button className="min-h-[44px] min-w-[44px] rounded-full border border-line bg-white md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="card mb-4 flex flex-col gap-3 md:hidden" onClick={() => setOpen(false)}>
          <a href="/#how" className="py-2 font-bold">How it works</a><a href="/#features" className="py-2 font-bold">Features</a>
          <Link className="btn btn-outline" to={home}>{user ? 'Open app' : t('Sign in')}</Link>
          {!user && <Link className="btn" to="/signup">{t('Sign up')}</Link>}
          <div><LangToggle /></div>
        </div>
      )}
    </header>
  );
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const items = NAV[user.role] || [];
  const links = (
    <>
      {items.map(([to, label]) => (
        <NavLink key={to + label} end={to === '/app'} to={to} onClick={() => setOpen(false)}
          className={({ isActive }) => `rounded-xl px-4 py-3 ${isActive ? 'bg-ink-soft font-bold text-white' : 'text-[#BFD9D6] hover:bg-ink-soft/60'}`}>{t(label)}</NavLink>
      ))}
    </>
  );
  const out = () => { logout(); nav('/'); };
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 bg-gradient-to-b from-ink to-[#123A3D] p-6 lg:flex xl:w-64">
        <Link to="/" className="mb-6"><Logo light /></Link>{links}
        <div className="mt-auto flex flex-col gap-3 text-sm text-[#BFD9D6]">
          <span className="truncate px-4">{user.name}</span><LangToggle dark />
          <button onClick={out} className="rounded-xl px-4 py-3 text-start hover:bg-ink-soft/60">{t('Sign out')}</button>
        </div>
      </aside>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link to="/"><Logo light /></Link>
        <button className="min-h-[44px] min-w-[44px] rounded-full border border-white/30 text-white" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-[68px] z-20 flex flex-col gap-1 bg-ink p-4 shadow-xl lg:hidden">
          {links}<div className="flex items-center justify-between px-4 pt-3"><LangToggle dark /><button onClick={out} className="font-bold text-white">{t('Sign out')}</button></div>
        </div>
      )}
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
