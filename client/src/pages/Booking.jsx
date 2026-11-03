import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { api, isoDay, fmtDate } from '../lib/api.js';
import { Alert, Spinner } from '../components/ui.jsx';

export default function Booking() {
  const { triageId } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [docs, setDocs] = useState(null);
  const [doc, setDoc] = useState(sp.get('doctor') || '');
  const [date, setDate] = useState(isoDay(0));
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('clinic');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/doctors').then((d) => { setDocs(d.items); if (!doc && d.items[0]) setDoc(d.items[0]._id); }).catch((e) => setErr(e.message)); }, []); // eslint-disable-line
  useEffect(() => { if (!doc) return; setTime(''); api(`/doctors/${doc}/slots?date=${date}`).then((d) => setSlots(d.slots)).catch((e) => setErr(e.message)); }, [doc, date]);

  if (!docs) return err ? <Alert>{err}</Alert> : <Spinner />;
  const d = docs.find((x) => x._id === doc);
  const confirm = async () => {
    setErr(''); setBusy(true);
    try { await api('/appointments', { method: 'POST', body: { doctorId: doc, triageId, date, time, mode } }); nav('/app', { state: { booked: true } }); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <h1 className="text-3xl">Book an appointment</h1>
      <Alert>{err}</Alert>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card flex flex-col gap-3 lg:col-span-1">
          <h2 className="text-xl">Choose a doctor</h2>
          {docs.map((x) => (
            <button key={x._id} onClick={() => setDoc(x._id)} aria-pressed={x._id === doc} className={`flex items-center gap-3 rounded-2xl border-[1.5px] p-3 text-start ${x._id === doc ? 'border-teal bg-teal-soft' : 'border-line bg-white'}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-soft font-bold text-teal-dark">{x.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
              <span><span className="block font-bold">{x.name}</span><span className="mut">{x.specialty} · Rs {x.fee}</span></span></button>))}
        </div>
        <div className="card flex flex-col gap-4 lg:col-span-1">
          <h2 className="text-xl">Choose a time</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4">{[...Array(7)].map((_, i) => (
            <button key={i} onClick={() => setDate(isoDay(i))} className={`min-h-[56px] rounded-xl border-[1.5px] px-1 text-sm font-bold ${date === isoDay(i) ? 'border-teal bg-teal text-white' : 'border-line bg-white'}`}>{fmtDate(isoDay(i)).replace(',', '')}</button>))}</div>
          <div className="grid grid-cols-2 gap-2">{slots.map((s) => (
            <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)} className={`min-h-[48px] rounded-xl border-[1.5px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${time === s.time ? 'border-teal bg-teal text-white' : 'border-line bg-white'}`}>{s.time}</button>))}</div>
          <div className="grid grid-cols-2 gap-2">{[['clinic', 'Clinic visit'], ['video', 'Video call']].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`min-h-[48px] rounded-xl border-[1.5px] font-bold ${mode === k ? 'border-teal bg-teal text-white' : 'border-line bg-white'}`}>{l}</button>))}</div>
        </div>
        <div className="card flex flex-col gap-3 lg:col-span-1">
          <h2 className="text-xl">Summary</h2>
          <p className="mut">{d?.name} · {d?.specialty}</p><p className="font-bold">{fmtDate(date)} {time && `· ${time}`}</p>
          <p className="mut">{triageId ? 'Your intake summary will be shared with this doctor.' : 'No symptom check attached. You can start one first.'}</p>
          <button className="btn" disabled={!time || busy} onClick={confirm}>{busy ? 'Booking…' : 'Confirm booking'}</button>
          {!triageId && <Link className="btn btn-outline" to="/app/check">New symptom check</Link>}
        </div>
      </div>
    </div>
  );
}
