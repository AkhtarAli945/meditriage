import { ChatGroq } from '@langchain/groq';
import { config } from '../config.js';

let model = null;
export const llmAvailable = () => Boolean(config.groqKey);
export function getLLM() {
  if (!llmAvailable()) return null;
  model ||= new ChatGroq({ apiKey: config.groqKey, model: config.model, temperature: 0, maxTokens: 600 });
  return model;
}
// Strip phone numbers and emails before text leaves our servers.
export const redact = (s) => s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/\+?\d[\d\s-]{8,}\d/g, '[phone]');
export async function askJSON(system, user) {
  const llm = getLLM();
  if (!llm) return null;
  const res = await llm.invoke([{ role: 'system', content: system }, { role: 'user', content: user }]);
  const text = typeof res.content === 'string' ? res.content : res.content.map((c) => c.text || '').join('');
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}
