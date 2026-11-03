import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { Logo, Alert, Field, LangToggle } from '../components/ui.jsx';

function Frame({ title, sub, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,560px)] xl:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-ink to-[#123A3D] p-12 text-white lg:flex">
        <Link to="/"><Logo light /></Link>
        <div className="flex max-w-md flex-col gap-4"><h2 className="text-4xl leading-tight">Care that starts with a conversation.</h2><p className="text-[#BFD9D6]">Describe how you feel. We help you reach the right doctor, quickly and safely.</p></div>
        <p className="text-sm text-[#BFD9D6]">Your data is encrypted. You control what is shared.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-8 sm:px-8">
        <div className="card flex w-full max-w-[480px] flex-col gap-5 sm:p-9">
          <div className="flex items-center justify-between lg:hidden"><Link to="/"><Logo /></Link><LangToggle /></div>
          <div><h1 className="text-3xl">{title}</h1><p className="mut mt-1">{sub}</p></div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function SignIn() {
  const { login, user } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const u = await login(f.email, f.password); nav(loc.state?.from || homeFor(u.role), { replace: true }); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Frame title={t('Welcome back')} sub="Sign in to continue your care.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Alert>{err}</Alert>
        <Field label={t('Email')} id="email"><input id="email" className="input" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label={t('Password')} id="password"><input id="password" className="input" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : t('Sign in')}</button>
      </form>
      <p className="mut text-center">New here? <Link to="/signup" className="font-bold text-teal">{t('Sign up')}</Link></p>
      {import.meta.env.DEV && (
        <details className="mut rounded-2xl bg-page p-3"><summary className="cursor-pointer font-bold">Demo accounts</summary>
          <p className="mt-2">patient@meditriage.test / Patient@12345<br />dr.khan@meditriage.test / Doctor@12345<br />admin@meditriage.test / Admin@12345</p></details>
      )}
    </Frame>
  );
}

export function SignUp() {
  const { register, user } = useAuth();
  const { t, lang, setLang } = useLang();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', consentAi: false, consentShare: true });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.consentAi) return setErr('You must consent to AI-assisted processing to continue.');
    setBusy(true);
    try { await register({ ...f, language: lang }); nav('/app', { replace: true }); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Frame title={t('Create your account')} sub="It takes a minute. Then start your first symptom check.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Alert>{err}</Alert>
        <Field label={t('Full name')} id="name"><input id="name" className="input" autoComplete="name" required value={f.name} onChange={set('name')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Email')} id="email"><input id="email" className="input" type="email" autoComplete="email" required value={f.email} onChange={set('email')} /></Field>
          <Field label={t('Phone')} id="phone"><input id="phone" className="input" type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" required value={f.phone} onChange={set('phone')} /></Field>
        </div>
        <Field label={t('Password')} id="password">
          <div className="relative"><input id="password" className="input pe-20" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={f.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow(!show)} className="absolute end-3 top-1/2 -translate-y-1/2 px-2 text-sm text-teal">{show ? 'Hide' : 'Show'}</button></div>
          <span className="mut font-normal">At least 8 characters.</span>
        </Field>
        <div className="flex items-center gap-3"><span className="text-sm font-bold">{t('Language')}</span>
          <button type="button" className={`chip ${lang === 'en' ? 'bg-teal-soft' : ''}`} onClick={() => setLang('en')}>English</button>
          <button type="button" className={`chip ${lang === 'ur' ? 'bg-teal-soft' : ''}`} onClick={() => setLang('ur')}>اردو</button></div>
        {[['consentAi', 'I consent to AI-assisted processing of my symptoms (required)'], ['consentShare', 'Share my intake summary with the doctor I book']].map(([k, label]) => (
          <label key={k} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-teal" checked={f[k]} onChange={set(k)} />{label}</label>
        ))}
        <p className="mut">This is not a diagnosis or an emergency service.</p>
        <button className="btn" disabled={busy}>{busy ? 'Creating account…' : t('Sign up')}</button>
      </form>
      <p className="mut text-center">Already have an account? <Link to="/signin" className="font-bold text-teal">{t('Sign in')}</Link></p>
    </Frame>
  );
}