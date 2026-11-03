import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, EMERGENCY } from '../lib/api.js';
import { Spinner, Alert, UrgencyTag } from '../components/ui.jsx';

const TONE = { emergency: 'bg-[#FDE3E0] border-[#F2B8B2]', urgent: 'bg-[#FFEFCC] border-[#F1D48B]', routine: 'bg-[#DDF3E4] border-[#A8DDB9]' };
const HEAD = { emergency: 'Get emergency care now', urgent: 'See a doctor within 24 hours', routine: 'A routine visit is fine' };
export default function Result() {
  const { id } = useParams();
  const [t, setT] = useState(null);
  const [docs, setDocs] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`/triage/${id}`).then(async (d) => {
      setT(d.triage);
      if (d.triage.urgency !== 'emergency') setDocs((await api(`/doctors?specialty=${encodeURIComponent(d.triage.department || '')}`)).items);
    }).catch((e) => setErr(e.message));
  }, [id]);
  if (err) return <Alert>{err}</Alert>;
  if (!t) return <Spinner />;
  const emer = t.urgency === 'emergency';
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className={`flex flex-col items-start justify-between gap-4 rounded-[20px] border p-6 sm:flex-row sm:items-center ${TONE[t.urgency]}`}>
        <div className="flex flex-col gap-2"><span className="w-fit"><UrgencyTag urgency={t.urgency} /></span><h1 className="text-3xl">{HEAD[t.urgency]}</h1>
          <p className="font-medium">Recommended: {t.department}</p></div>
        {emer ? <a className="btn btn-danger" href={`tel:${EMERGENCY}`}>Call {EMERGENCY} now</a> : <Link className="btn" to={`/app/book/${t._id}`}>Book a doctor</Link>}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card flex flex-col gap-3"><h2 className="text-xl">Why this result</h2>
          <ul className="flex list-disc flex-col gap-2 ps-5 text-mut">{(t.reasons || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
          <p className="mut">Confidence {Math.round((t.confidence || 0) * 100)}% · {t.engine === 'rules' ? 'safety rule' : t.engine}</p></div>
        <div className="card flex flex-col gap-3"><h2 className="text-xl">Go to the ER immediately if</h2>
          <p className="mut">Pain spreads to your arm or jaw, you feel faint, you cannot breathe well, or symptoms suddenly get worse.</p>
          {(t.sources || []).length > 0 && <><h3 className="text-base">Guidelines used</h3><ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-mut">{t.sources.map((s) => <li key={s}>{s}</li>)}</ul></>}</div>
      </div>
      {!emer && (<>
        <h2 className="text-2xl">Suggested doctors</h2>
        <div className="grid gap-4 md:grid-cols-2">{docs.map((d) => (
          <div key={d._id} className="card flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-soft font-bold text-teal-dark">{d.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
            <div className="min-w-0 flex-1"><div className="font-bold">{d.name}</div><div className="mut">{d.specialty} · {d.experience} yrs</div></div>
            <Link className="btn btn-outline" to={`/app/book/${t._id}?doctor=${d._id}`}>Select</Link></div>))}</div></>)}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="mut">This is not a diagnosis. A licensed doctor makes all medical decisions.</p>
        <button className="btn btn-outline" onClick={() => window.print()}>Download summary</button></div>
    </div>
  );
}
