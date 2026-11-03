import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, EMERGENCY } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';
import { Alert } from '../components/ui.jsx';

const FIELDS = [['concern', 'Concern'], ['duration', 'Duration'], ['severity', 'Severity'], ['age', 'Age']];
export default function Chat() {
  const { t, lang } = useLang();
  const nav = useNavigate();
  const started = useRef(false);
  const endRef = useRef(null);
  const [tid, setTid] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [quick, setQuick] = useState([]);
  const [slots, setSlots] = useState({});
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (started.current) return; started.current = true;
    api('/triage', { method: 'POST', body: { language: lang } }).then((d) => { setTid(d.id); setMsgs(d.messages); }).catch((e) => setErr(e.message));
  }, [lang]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs, busy]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy || done || !tid) return;
    setErr(''); setBusy(true); setInput(''); setQuick([]);
    setMsgs((m) => [...m, { role: 'user', content }]);
    try {
      const d = await api(`/triage/${tid}/messages`, { method: 'POST', body: { content } });
      setMsgs((m) => [...m, { role: 'assistant', content: d.reply }]);
      setSlots(d.slots); setStep(d.step); setQuick(d.quick);
      if (d.done) { setDone(true); setTimeout(() => nav(`/app/result/${tid}`), 1400); }
    } catch (e) { setErr(e.message); setMsgs((m) => m.slice(0, -1)); setInput(content); } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3 xl:gap-6">
      <section className="card flex min-h-[70vh] flex-col gap-4 lg:col-span-2 lg:min-h-[640px]" aria-label={t('Symptom check')}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl">{t('Symptom check')}</h1><span className="mut">Step {Math.min(step + 1, 4)} of 4 · about 2 min</span></div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} dir="auto" className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed sm:max-w-[78%] ${m.role === 'user' ? 'self-end bg-teal text-white' : 'self-start bg-[#EAF3F2]'}`}>{m.content}</div>
          ))}
          {busy && <div className="self-start rounded-2xl bg-[#EAF3F2] px-4 py-3 text-mut">…</div>}
          {!tid && !err && <p className="mut">Starting your check…</p>}
          <div ref={endRef} />
        </div>
        <Alert>{err}</Alert>
        {quick.length > 0 && <div className="flex flex-wrap gap-2">{quick.map((q) => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}</div>}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input dir="auto" className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('Type your answer…')} aria-label={t('Type your answer…')} maxLength={1000} disabled={done} />
          <button className="btn shrink-0" disabled={busy || done || !input.trim()}>{t('Send')}</button>
        </form>
      </section>
      <aside className="flex flex-col gap-5">
        <div className="card flex flex-col gap-1">
          <h2 className="mb-2 text-xl">{t('Live intake summary')}</h2>
          {FIELDS.map(([k, label]) => (<div key={k} className="row-item justify-between"><span className="mut">{label}</span><span className="max-w-[60%] break-words text-end font-bold">{slots[k] || '—'}</span></div>))}
        </div>
        <div className="card flex flex-col gap-3"><h2 className="text-xl">Progress</h2>
          <div className="h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${Math.min(100, (step / 4) * 100)}%` }} /></div>
          <p className="mut">{done ? 'Done. Preparing your result…' : `${step} of 4 answers captured.`}</p></div>
        <div className="rounded-[20px] bg-[#FDE3E0] p-5 font-bold text-[#9B1C12]">{t('Severe pain, fainting or breathlessness? Call emergency services now.')} <a className="underline" href={`tel:${EMERGENCY}`}>{EMERGENCY}</a></div>
      </aside>
    </div>
  );
}
