import { Link } from 'react-router-dom';
import { PublicNav } from '../components/Shell.jsx';
import { Logo } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';

const Tick = () => (<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="#0B6B6A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const FEATURES = [
  ['Urdu and English', 'Patients chat in the language they think in, right to left when needed.'],
  ['Emergency-first rules', 'Deterministic red-flag checks run before any AI decision.'],
  ['Doctor in the loop', 'Every result can be approved or overridden, with an audit trail.'],
  ['Cited guidelines', 'Scores come with the clinical sources that informed them.'],
  ['Booking built in', 'Pick a suggested doctor and slot. Your summary goes with you.'],
  ['Multi-role access', 'Separate, secure views for patients, doctors and clinic admins.'],
];
export default function Landing() {
  const { user } = useAuth();
  const { t } = useLang();
  const start = user ? '/app/check' : '/signup';
  return (
    <div>
      <PublicNav />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:py-14">
        <div className="flex flex-col items-start gap-5">
          <span className="tag bg-teal-soft text-teal-dark">AI-assisted · doctor-reviewed</span>
          <h1 className="text-4xl leading-[1.08] sm:text-5xl xl:text-6xl">{t('Tell us how you feel. We point you to the right care, fast.')}</h1>
          <p className="max-w-xl text-lg text-mut">Describe your symptoms in plain Urdu or English. Our triage agent asks smart follow-ups, scores urgency and books the right doctor.</p>
          <div className="flex flex-wrap gap-3"><Link className="btn" to={start}>{t('Start symptom check')}</Link><Link className="btn btn-outline" to="/signin">{t('Sign in')}</Link></div>
          <p className="text-sm font-bold text-[#9B1C12]">Emergency? Call your local emergency number now. Do not wait for chat.</p>
        </div>
        <div className="card flex flex-col gap-3 p-5 shadow-xl sm:p-7" aria-label="Example conversation">
          <div className="max-w-[80%] self-start rounded-2xl bg-[#EAF3F2] px-4 py-3">Hi, I am your intake assistant. What brings you in today?</div>
          <div className="max-w-[80%] self-end rounded-2xl bg-teal px-4 py-3 text-white">Fever and sore throat since two days</div>
          <div className="max-w-[80%] self-start rounded-2xl bg-[#EAF3F2] px-4 py-3">Sorry to hear that. On a scale of 1 to 10, how severe is it?</div>
          <div className="flex flex-wrap gap-2"><span className="chip">1–3</span><span className="chip">4–6</span><span className="chip">7–10</span></div>
        </div>
      </section>
      <section id="how" className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 sm:px-8 md:grid-cols-3">
        {[['Describe', 'Chat in your own words. The agent adapts its questions to you.'], ['Triage', 'Urgency is scored as emergency, urgent or routine, with clear reasons.'], ['Book', 'Pick a suggested doctor and slot. Your intake summary goes with you.']].map(([h, p], i) => (
          <div key={h} className="card flex flex-col gap-2"><span className="tag w-fit bg-teal-soft text-teal-dark">Step {i + 1}</span><h3 className="text-xl">{h}</h3><p className="mut">{p}</p></div>
        ))}
      </section>
      <section id="features" className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <h2 className="mb-5 text-3xl">Built for real clinics</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([h, p]) => (<div key={h} className="card flex flex-col gap-2"><span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft"><Tick /></span><h3 className="text-xl">{h}</h3><p className="mut">{p}</p></div>))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-[20px] bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div><h3 className="text-2xl">Safety first</h3><p className="text-[#BFD9D6]">Hard-coded emergency rules run before the AI. Every result is doctor-reviewable.</p></div>
          <Link className="btn bg-white text-ink border-white hover:bg-teal-soft" to={start}>{t('Start symptom check')}</Link>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-8 text-sm text-mut sm:flex-row sm:px-8"><Logo /><span>Not a diagnosis and not a substitute for emergency care.</span></footer>
    </div>
  );
}
