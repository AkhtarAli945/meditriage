import { useEffect, useState } from 'react';
import { api, fmtDate } from '../lib/api.js';
import { Spinner, Alert, UrgencyTag, Empty } from '../components/ui.jsx';

const TABS = ['Analytics', 'Safety log', 'Rules', 'Agent traces', 'Integrations'];
const Stat = ({ label, value }) => (<div className="card flex flex-col gap-1"><span className="mut">{label}</span><span className="font-display text-4xl font-semibold">{value}</span></div>);

export default function Admin() {
  const [tab, setTab] = useState(TABS[0]);
  const [res, setRes] = useState({ tab: null, data: null });
  const data = res.tab === tab ? res.data : null;
  const [err, setErr] = useState('');
  const path = { Analytics: '/admin/stats', 'Safety log': '/admin/safety-log', Rules: '/admin/rules', 'Agent traces': '/admin/traces' }[tab];
  const load = () => { if (!path) return; api(path).then((d) => setRes({ tab, data: d })).catch((e) => setErr(e.message)); };
  useEffect(() => { setErr(''); load(); }, [tab]); // eslint-disable-line
  const toggle = async (r) => { try { await api(`/admin/rules/${r._id}`, { method: 'PATCH', body: { enabled: !r.enabled } }); load(); } catch (e) { setErr(e.message); } };
  const max = data?.days ? Math.max(1, ...data.days.map((d) => d.count)) : 1;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl">Clinic admin</h1>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">{TABS.map((x) => <button key={x} role="tab" aria-selected={tab === x} className={`tab ${tab === x ? 'tab-on' : ''}`} onClick={() => setTab(x)}>{x}</button>)}</div>
      <Alert>{err}</Alert>
      {path && !data && !err && <Spinner />}
      {tab === 'Analytics' && data && (<>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><Stat label="Checks, last 7 days" value={data.total} /><Stat label="Emergency escalations" value={data.emergencies} /><Stat label="Doctor override rate" value={`${data.overrideRate}%`} /><Stat label="Booked appointments" value={data.appointments} /></div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card flex flex-col gap-3 lg:col-span-2"><h2 className="text-xl">Daily triage volume</h2>
            <div className="flex h-44 items-end gap-2 sm:gap-4">{data.days.map((d) => (<div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-xs font-bold">{d.count}</span><div className="w-full rounded-t-lg bg-teal" style={{ height: `${Math.max(4, (d.count / max) * 120)}px` }} /><span className="mut text-xs">{d.label}</span></div>))}</div></div>
          <div className="card flex flex-col gap-3"><h2 className="text-xl">Urgency mix</h2>
            {['emergency', 'urgent', 'routine'].map((u) => (<div key={u} className="flex items-center gap-3"><UrgencyTag urgency={u} /><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line"><div className={`h-full ${u === 'emergency' ? 'bg-[#B3261E]' : u === 'urgent' ? 'bg-[#D98E04]' : 'bg-[#14602F]'}`} style={{ width: `${data.total ? (data.mix[u] / data.total) * 100 : 0}%` }} /></div><span className="font-bold">{data.mix[u]}</span></div>))}</div>
        </div></>)}
      {tab === 'Safety log' && data && <div className="card">{data.items.length === 0 ? <Empty title="No safety events" hint="Emergencies, low-confidence results and overrides appear here." /> : data.items.map((i) => (
        <div key={i._id} className="row-item justify-between"><UrgencyTag urgency={i.urgency} /><span className="min-w-0 flex-1 text-sm">{i.flags?.length ? i.flags.join(', ') : `Confidence ${Math.round((i.confidence || 0) * 100)}%`}{i.review?.status === 'overridden' ? ' · overridden by doctor' : ''}</span><span className="mut">{fmtDate(i.createdAt)}</span></div>))}</div>}
      {tab === 'Rules' && data && <div className="card"><p className="mut mb-2">Emergency rules run before the AI. Turn a rule off only with clinical approval.</p>{data.items.map((r) => (
        <div key={r._id} className="row-item justify-between"><span className="min-w-0 flex-1 font-bold">{r.label}</span><span className="tag bg-[#FDE3E0] text-[#9B1C12]">{r.level}</span>
          <button role="switch" aria-checked={r.enabled} aria-label={`${r.label} enabled`} onClick={() => toggle(r)} className={`h-[26px] w-11 rounded-full p-0.5 transition ${r.enabled ? 'bg-teal' : 'bg-[#C9D6D4]'}`}><span className={`block h-[22px] w-[22px] rounded-full bg-white transition ${r.enabled ? 'translate-x-[18px] rtl:-translate-x-[18px]' : ''}`} /></button></div>))}</div>}
      {tab === 'Agent traces' && data && <div className="flex flex-col gap-4">{data.items.length === 0 ? <div className="card"><Empty title="No runs yet" hint="Complete a symptom check to see the agent trace." /></div> : data.items.map((t) => (
        <div key={t._id} className="card flex flex-col gap-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-bold">Run {String(t._id).slice(-5)}</span><UrgencyTag urgency={t.urgency} /><span className="mut">{fmtDate(t.createdAt)}</span></div>
          {t.trace.map((s, i) => (<div key={i} className="row-item"><span className="h-3.5 w-3.5 rounded-full bg-teal" /><span className="min-w-[140px] font-bold">{s.node}</span><span className="mut">{s.ms} ms</span><span className="mut">{s.note}</span></div>))}</div>))}</div>}
      {tab === 'Integrations' && (<div className="grid gap-5 md:grid-cols-3">{[['EMR (FHIR)', 'Push intake summaries to patient records.', 'Planned'], ['WhatsApp via n8n', 'Reminders and follow-ups. Add your n8n webhook in the server .env.', 'Planned'], ['Payments', 'Teleconsult fees.', 'Planned']].map(([h, p, s]) => (
        <div key={h} className="card flex flex-col gap-2"><h3 className="text-xl">{h}</h3><p className="mut">{p}</p><span className="tag w-fit bg-[#FFEFCC] text-[#7A4B00]">{s}</span></div>))}</div>)}
    </div>
  );
}
