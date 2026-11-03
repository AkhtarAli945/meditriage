import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { checkRedFlags } from './redFlags.js';
import { retrieve } from './guidelines.js';
import { askJSON, redact, llmAvailable } from './llm.js';

export const STEPS = ['concern', 'duration', 'severity', 'age'];
const Q = {
  en: {
    concern: 'What is your main concern today?',
    duration: 'How long has this been going on?',
    severity: 'On a scale of 1 to 10, how severe is it right now?',
    age: 'How old are you (or the patient)?',
  },
  ur: {
    concern: 'آپ کو کیا تکلیف ہے؟',
    duration: 'یہ تکلیف کب سے ہے؟',
    severity: '1 سے 10 کے پیمانے پر، اس وقت تکلیف کتنی شدید ہے؟',
    age: 'آپ (یا مریض) کی عمر کیا ہے؟',
  },
};
const QUICK = {
  duration: { en: ['Today', '2–3 days', 'A week or more'], ur: ['آج سے', '2–3 دن', 'ایک ہفتہ یا زیادہ'] },
  severity: { en: ['1–3', '4–6', '7–10'], ur: ['1–3', '4–6', '7–10'] },
};
// The user can write in English or Urdu at any point; each reply follows the language of their latest message.
export const detectLang = (text, fallback = 'en') => (/[\u0600-\u06FF]/.test(text) ? 'ur' : /[A-Za-z]{2,}/.test(text) ? 'en' : fallback);
export const firstQuestion = () => `${Q.en.concern} / ${Q.ur.concern}`;
export const quickFor = (step, lang) => QUICK[STEPS[step]]?.[lang] || [];

const MSG = {
  en: {
    retry: "Sorry, I didn't understand that.",
    emergency: 'This may be an emergency. Please call your local emergency number or go to the nearest emergency room now. Do not wait for this chat.',
    done: (u, d) => `Thanks. Your result: ${u.toUpperCase()}. Recommended: ${d}. Please review the details and book a doctor.`,
  },
  ur: {
    retry: 'معذرت، میں سمجھ نہیں سکا۔',
    emergency: 'یہ ایمرجنسی ہو سکتی ہے۔ براہ کرم فوراً ایمرجنسی نمبر پر کال کریں یا قریبی ہسپتال جائیں۔ اس چیٹ کا انتظار نہ کریں۔',
    done: (u, d) => `شکریہ۔ آپ کا نتیجہ: ${{ emergency: 'ایمرجنسی', urgent: 'فوری', routine: 'معمول کے مطابق' }[u] || u}۔ تجویز: ${d}۔ تفصیل دیکھ کر ڈاکٹر بُک کریں۔`,
  },
};

const EX = {
  en: { concern: 'For example: "fever and sore throat".', duration: 'For example: "2 days" or "since morning".', severity: 'Please give a number from 1 to 10.', age: 'Please give a number, for example 30.' },
  ur: { concern: 'مثال: "بخار اور گلے میں درد"۔', duration: 'مثال: "دو دن سے" یا "صبح سے"۔', severity: 'براہ کرم 1 سے 10 کے درمیان نمبر بتائیں۔', age: 'براہ کرم نمبر بتائیں، جیسے 30۔' },
};
const SYMPTOMS = /pain|ache|fever|cough|cold|flu|throat|rash|itch|vomit|nausea|dizz|breath|chest|stomach|bleed|swell|burn|weak|sick|injur|sugar|diarrh|sneez|infect|درد|بخار|کھانسی|گلا|خارش|الٹی|چکر|سانس|سینے|پیٹ|خون|dard|bukhar|khansi|ulti|seene/i;
const TIME = /\d|today|yesterday|tonight|morning|night|day|week|month|year|hour|since|ago|aaj|kal|din|hafta|mahin|saal|گھنٹ|آج|کل|دن|ہفتہ|ماہ|مہینہ|سال|صبح|رات/i;
const SEV_WORDS = /mild|moderate|severe|unbearable|little|slight|very|bohat|bahut|thora|shadeed|شدید|ہلکا|تھوڑا|بہت|درمیانہ/i;
const letters = (s) => (s.match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
const looksLikeText = (s) => {
  if (letters(s) < 5) return false;
  if (/[\u0600-\u06FF]/.test(s)) return true;
  return /[aeiouy]/i.test(s) && !/[^aeiouy\s\d]{5,}/i.test(s) && !/(.)\1{3,}/i.test(s);
};
// Rejects answers like "n" or "asdfgh" so the agent asks again instead of moving on.
function validate(key, v) {
  const num = v.match(/\d+/);
  if (key === 'concern') return SYMPTOMS.test(v) || looksLikeText(v);
  if (key === 'duration') return TIME.test(v);
  if (key === 'severity') return num ? +num[0] <= 10 : SEV_WORDS.test(v);
  if (key === 'age') return num ? +num[0] <= 120 : /newborn|infant|baby|toddler|بچہ/i.test(v);
  return true;
}

const State = Annotation.Root({
  language: Annotation(), userText: Annotation(), allText: Annotation(), rules: Annotation(),
  slots: Annotation(), step: Annotation(), flags: Annotation(), sources: Annotation(),
  result: Annotation(), reply: Annotation(), done: Annotation(), invalid: Annotation(),
  trace: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }),
});

const timed = (node, fn) => async (s) => {
  const t = Date.now();
  const { note, ...patch } = await fn(s);
  return { ...patch, trace: [{ node, ms: Date.now() - t, note: note || '' }] };
};

const intake = timed('intake', (s) => {
  const key = STEPS[s.step];
  const v = s.userText.trim();
  const language = detectLang(v, s.language);
  if (!validate(key, v)) return { language, invalid: true, note: `unclear answer for ${key}, asking again` };
  const slots = { ...(s.slots || {}) };
  if (key === 'severity') { const n = v.match(/\d+/); slots.severityNum = n ? Math.min(10, +n[0]) : /mild|little|slight|ہلکا|تھوڑا/i.test(v) ? 2 : /severe|unbearable|شدید/i.test(v) ? 9 : 5; }
  if (key === 'age') { const n = v.match(/\d+/); slots.ageNum = n ? +n[0] : 1; }
  slots[key] = v;
  return { slots, language, invalid: false, step: s.step + 1, note: `captured ${key} (${language})` };
});

const redflag = timed('red-flag rules', (s) => {
  const hits = checkRedFlags(s.allText, s.rules);
  return { flags: hits.map((h) => h.label), note: hits.length ? `${hits.length} rule(s) fired` : 'none fired' };
});

const emergency = timed('emergency', (s) => ({
  result: { urgency: 'emergency', reasons: s.flags.map((f) => `Matched safety rule: ${f}`), department: 'Emergency care', confidence: 1, engine: 'rules' },
  reply: MSG[s.language].emergency, done: true, note: 'rules override AI',
}));

const retrieveNode = timed('guideline retrieval', (s) => {
  const hits = retrieve(s.allText);
  return { sources: hits.map((h) => h.source), result: { dept: hits[0]?.dept }, note: `${hits.length} source(s)` };
});

function heuristic(s) {
  const sev = s.slots.severityNum ?? 5, age = s.slots.ageNum, dur = (s.slots.duration || '').toLowerCase();
  const reasons = [];
  let score = 0;
  if (sev >= 7) { score += 2; reasons.push(`High reported severity (${sev}/10).`); }
  else if (sev >= 4) { score += 1; reasons.push(`Moderate severity (${sev}/10).`); }
  if (/week|ہفتہ|\b([4-9]|\d{2,})\s*day/.test(dur)) { score += 1; reasons.push('Symptoms have lasted a long time.'); }
  if (age != null && (age >= 60 || age <= 5)) { score += 1; reasons.push('Age group has higher risk.'); }
  if (/chest|سینے/i.test(s.allText)) { score += 1; reasons.push('Chest symptoms need in-person assessment.'); }
  return { urgency: score >= 2 ? 'urgent' : 'routine', reasons: reasons.length ? reasons : ['No high-risk features reported.'], confidence: 0.62, engine: 'rule-based' };
}

const score = timed('urgency scoring', async (s) => {
  let out = null;
  if (llmAvailable()) {
    try {
      out = await askJSON(
        'You are a clinical triage assistant. You do NOT diagnose. Emergencies are decided by separate safety rules, so answer only "urgent" or "routine". Reply with JSON only: {"urgency":"urgent|routine","reasons":["short reason"],"department":"string","confidence":0-1}.',
        `Patient intake (PII removed):\n${redact(JSON.stringify(s.slots))}\nGuidelines:\n${(s.sources || []).join('\n')}`,
      );
    } catch { out = null; }
  }
  const base = out && ['urgent', 'routine'].includes(out.urgency) ? { ...out, engine: 'llm' } : heuristic(s);
  const conf = Math.max(0, Math.min(1, +base.confidence || 0.6));
  return {
    result: { urgency: base.urgency, reasons: base.reasons, department: base.department || s.result?.dept || 'General Physician', confidence: conf, engine: base.engine },
    done: true, note: `${base.engine} · confidence ${conf.toFixed(2)}`,
  };
});

const finalize = timed('compose reply', (s) => ({ reply: MSG[s.language].done(s.result.urgency, s.result.department), note: 'done' }));
const reask = timed('re-ask', (s) => ({ reply: `${MSG[s.language].retry} ${EX[s.language][STEPS[s.step]]} ${Q[s.language][STEPS[s.step]]}`, done: false, note: `unclear ${STEPS[s.step]}` }));
const ask = timed('ask next', (s) => ({ reply: Q[s.language][STEPS[s.step]], done: false, note: STEPS[s.step] }));

const graph = new StateGraph(State)
  .addNode('intake', intake).addNode('redflag', redflag).addNode('emergency', emergency)
  .addNode('retrieve', retrieveNode).addNode('score', score).addNode('finalize', finalize).addNode('ask', ask).addNode('reask', reask)
  .addEdge(START, 'intake').addEdge('intake', 'redflag')
  .addConditionalEdges('redflag', (s) => (s.flags.length ? 'emergency' : s.invalid ? 'reask' : s.step >= STEPS.length ? 'retrieve' : 'ask'),
    { emergency: 'emergency', reask: 'reask', retrieve: 'retrieve', ask: 'ask' })
  .addEdge('retrieve', 'score').addEdge('score', 'finalize')
  .addEdge('emergency', END).addEdge('finalize', END).addEdge('ask', END).addEdge('reask', END)
  .compile();

export async function runTurn({ session, text, rules }) {
  const prior = session.messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
  return graph.invoke({
    language: session.language, userText: text, allText: `${prior}\n${text}`, rules,
    slots: session.slots || {}, step: session.step, flags: [], sources: [], done: false,
  });
}