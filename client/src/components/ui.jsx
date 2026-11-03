import { useLang } from '../lib/i18n.jsx';

export const Logo = ({ light }) => (
  <span className={`flex items-center gap-2 font-display text-[22px] font-semibold ${light ? 'text-white' : 'text-ink'}`}>
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="8" fill="#0B6B6A" /><path d="M4 15h6l3-7 4 12 3-5h4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    MediTriage
  </span>
);
export const Spinner = ({ label = 'Loading…' }) => (
  <div role="status" className="flex items-center justify-center gap-3 p-10 text-mut">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />{label}
  </div>
);
const U = { emergency: 'bg-[#FDE3E0] text-[#9B1C12]', urgent: 'bg-[#FFEFCC] text-[#7A4B00]', routine: 'bg-[#DDF3E4] text-[#14602F]' };
export const UrgencyTag = ({ urgency }) => (urgency ? <span className={`tag ${U[urgency]}`}>{urgency.toUpperCase()}</span> : <span className="tag bg-teal-soft text-teal-dark">IN PROGRESS</span>);
export const Alert = ({ children, tone = 'error' }) => children ? (
  <div role="alert" className={`rounded-2xl px-4 py-3 text-sm font-medium ${tone === 'error' ? 'bg-[#FDE3E0] text-[#9B1C12]' : 'bg-[#DDF3E4] text-[#14602F]'}`}>{children}</div>
) : null;
export const Field = ({ label, id, children }) => (
  <label htmlFor={id} className="flex flex-col gap-1.5 text-sm font-bold">{label}{children}</label>
);
export const Empty = ({ title, hint, action }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center"><h3 className="text-xl">{title}</h3><p className="mut max-w-sm">{hint}</p>{action}</div>
);
export const LangToggle = ({ dark }) => {
  const { lang, setLang } = useLang();
  return (
    <button onClick={() => setLang(lang === 'en' ? 'ur' : 'en')} className={`min-h-[40px] rounded-full border-[1.5px] px-4 text-sm font-bold ${dark ? 'border-white/30 text-white' : 'border-line bg-white text-ink'}`} aria-label="Change language">
      {lang === 'en' ? 'اردو' : 'English'}
    </button>
  );
};
