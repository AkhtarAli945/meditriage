import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, fmtDate, isoDay } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Spinner, UrgencyTag, Alert, Empty } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const loc = useLocation();
  const [appts, setAppts] = useState(null);
  const [checks, setChecks] = useState([]);
  const [err, setErr] = useState('');
  const load = () => Promise.all([api('/appointments/mine'), api('/triage/mine')]).then(([a, c]) => { setAppts(a.items); setChecks(c.items); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { try { await api(`/appointments/${id}/cancel`, { method: 'PATCH' }); load(); } catch (e) { setErr(e.message); } };
  if (!appts) return err ? <Alert>{err}</Alert> : <Spinner />;
  const upcoming = appts.filter((a) => a.status === 'booked' && a.date >= isoDay(0));
  const next = upcoming[0];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Hello, {user.name.split(' ')[0]}</h1><Link className="btn" to="/app/check">New symptom check</Link></div>
      {loc.state?.booked && <Alert tone="ok">Your appointment is booked.</Alert>}
      <Alert>{err}</Alert>
      <div className="flex flex-col items-start justify-between gap-3 rounded-[20px] bg-teal-soft p-6 sm:flex-row sm:items-center">
        {next ? (<><div><p className="mut">Next appointment</p><h2 className="text-2xl">{next.doctor?.name} · {fmtDate(next.date)} {next.time}</h2><p className="mut">{next.mode === 'video' ? 'Video call' : 'Clinic visit'} · intake summary shared</p></div>
          <button className="btn btn-outline" onClick={() => cancel(next._id)}>Cancel</button></>)
          : (<><div><h2 className="text-2xl">No upcoming appointments</h2><p className="mut">Start a symptom check to find the right doctor.</p></div><Link className="btn" to="/app/book">Book a doctor</Link></>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card"><h2 className="mb-2 text-xl">Recent checks</h2>
          {checks.length === 0 ? <Empty title="No checks yet" hint="Your symptom checks will appear here." /> : checks.map((c) => (
            <Link key={c._id} to={c.status === 'done' ? `/app/result/${c._id}` : '/app/check'} className="row-item justify-between hover:bg-page">
              <span className="min-w-0 flex-1 truncate font-bold">{c.slots?.concern || 'Unfinished check'}</span><span className="mut">{fmtDate(c.createdAt)}</span><UrgencyTag urgency={c.urgency} /></Link>))}</div>
        <div className="card"><h2 className="mb-2 text-xl">Appointments</h2>
          {appts.length === 0 ? <Empty title="Nothing booked" hint="Book a doctor after your symptom check." /> : appts.map((a) => (
            <div key={a._id} className="row-item justify-between"><span className="min-w-0 flex-1"><span className="block font-bold">{a.doctor?.name}</span><span className="mut">{fmtDate(a.date)} · {a.time}</span></span>
              <span className={`tag ${a.status === 'booked' ? 'bg-teal-soft text-teal-dark' : 'bg-line text-mut'}`}>{a.status}</span></div>))}</div>
      </div>
    </div>
  );
}
