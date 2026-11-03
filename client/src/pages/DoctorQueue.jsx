import { useEffect, useState } from 'react';
import { api, fmtDate } from '../lib/api.js';
import { Spinner, UrgencyTag, Alert, Empty } from '../components/ui.jsx';

const FILTERS = ['all', 'emergency', 'urgent', 'routine'];
export default function DoctorQueue() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);
  const [override, setOverride] = useState('urgent');
  const [err, setErr] = useState('');
  const load = () => api('/review/queue').then((d) => { setItems(d.items); setSel((s) => d.items.find((x) => x._id === s?._id) || null); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const act = async (action) => {
    try { await api(`/review/${sel._id}`, { method: 'PATCH', body: { action, urgency: action === 'override' ? override : undefined } }); load(); } catch (e) { setErr(e.message); }
  };
  if (!items) return err ? <Alert>{err}</Alert> : <Spinner />;
  const list = items.filter((i) => filter === 'all' || i.urgency === filter);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl">Triage queue</h1><span className="tag bg-teal-soft text-teal-dark">{items.filter((i) => i.review?.status === 'pending').length} awaiting review</span></div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">{FILTERS.map((f) => <button key={f} role="tab" aria-selected={filter === f} className={`tab capitalize ${filter === f ? 'tab-on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}</div>
      <Alert>{err}</Alert>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          {list.length === 0 ? <Empty title="Queue is clear" hint="New completed symptom checks will show up here." /> : list.map((i) => (
            <button key={i._id} onClick={() => setSel(i)} className={`row-item w-full justify-between text-start hover:bg-page ${sel?._id === i._id ? 'bg-teal-soft' : ''}`}>
              <UrgencyTag urgency={i.urgency} /><span className="min-w-0 flex-1"><span className="block font-bold">{i.patient?.name}</span><span className="mut block truncate">{i.slots?.concern}</span></span>
              <span className="mut">{fmtDate(i.createdAt)}</span><span className="mut capitalize">{i.review?.status}</span></button>))}
        </div>
        <div className="card flex flex-col gap-3 lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
          {!sel ? <Empty title="Select a patient" hint="Open a check to see the pre-visit brief." /> : (<>
            <h2 className="text-xl">Pre-visit brief · {sel.patient?.name}</h2>
            <p className="mut">{sel.slots?.concern}. Duration: {sel.slots?.duration}. Severity: {sel.slots?.severity}. Age: {sel.slots?.age}.</p>
            <div className="flex flex-wrap gap-2"><UrgencyTag urgency={sel.urgency} /><span className="tag bg-teal-soft text-teal-dark">{Math.round((sel.confidence || 0) * 100)}% confidence</span><span className="tag bg-line text-mut">{sel.engine}</span></div>
            <ul className="list-disc ps-5 text-sm text-mut">{(sel.reasons || []).map((r, k) => <li key={k}>{r}</li>)}</ul>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button className="btn" onClick={() => act('approve')}>Approve triage</button>
              <select aria-label="Override urgency" className="input !w-auto" value={override} onChange={(e) => setOverride(e.target.value)}>{['emergency', 'urgent', 'routine'].map((u) => <option key={u}>{u}</option>)}</select>
              <button className="btn btn-outline" onClick={() => act('override')}>Override</button></div>
            <p className="mut">Status: {sel.review?.status}{sel.review?.urgency ? ` → ${sel.review.urgency}` : ''}</p></>)}
        </div>
      </div>
    </div>
  );
}
