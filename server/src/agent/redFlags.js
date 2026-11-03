// Deterministic emergency rules. They run BEFORE any LLM decision and the model can never override them.
export const DEFAULT_RULES = [
  { key: 'chest-pain-sweat', label: 'Chest pain with sweating or breathlessness', pattern: '(chest|سینے|seene|seeney).*(sweat|breath|pasina|پسین|سانس|saans)|(sweat|breath|سانس|saans|pasina).*(chest|سینے|seene|seeney)', advice: 'Possible heart emergency.' },
  { key: 'stroke', label: 'Stroke signs (face droop, slurred speech, arm weakness)', pattern: 'face droop|slurred|cannot speak|arm weakness|one side.*(weak|numb)', advice: 'Possible stroke.' },
  { key: 'breathing', label: 'Severe difficulty breathing', pattern: "can'?t breathe|cannot breathe|severe breath|gasping|سانس نہیں|saans nahi", advice: 'Severe breathing difficulty.' },
  { key: 'self-harm', label: 'Thoughts of suicide or self-harm', pattern: 'suicid|kill myself|end my life|self[- ]harm|خودکشی|khudkushi', advice: 'Immediate human support needed.' },
  { key: 'bleeding', label: 'Heavy uncontrolled bleeding', pattern: "heavy bleeding|won'?t stop bleeding|bleeding (a lot|heavily)|خون بند نہیں", advice: 'Heavy bleeding.' },
  { key: 'unconscious', label: 'Fainting or unconsciousness', pattern: 'unconscious|passed out|fainted|not responding|بے ہوش|behosh', advice: 'Loss of consciousness.' },
  { key: 'infant-fever', label: 'Newborn with fever', pattern: '(newborn|infant|baby).*(fever|بخار)', advice: 'Fever in a very young infant.' },
];
export function checkRedFlags(text, rules = DEFAULT_RULES) {
  const hits = [];
  for (const r of rules) {
    if (r.enabled === false) continue;
    try { if (new RegExp(r.pattern, 'i').test(text)) hits.push(r); } catch { /* bad pattern ignored */ }
  }
  return hits;
}
