import { Router } from 'express';
import { z } from 'zod';
import { Triage, Rule } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { runTurn, firstQuestion, quickFor } from '../agent/graph.js';
import { DEFAULT_RULES } from '../agent/redFlags.js';
import { wrap, HttpError } from '../util.js';

const r = Router();
r.use(requireAuth);

r.post('/', wrap(async (req, res) => {
  const { language } = z.object({ language: z.enum(['en', 'ur']).optional() }).parse(req.body || {});
  const lang = language || req.user.language || 'en';
  const t = await Triage.create({ patient: req.user._id, language: lang, messages: [{ role: 'assistant', content: firstQuestion() }] });
  res.status(201).json({ id: t._id, messages: t.messages, quick: [], step: 0, slots: {} });
}));

r.post('/:id/messages', wrap(async (req, res) => {
  const { content } = z.object({ content: z.string().trim().min(1, 'Type an answer first.').max(1000) }).parse(req.body);
  const t = await Triage.findOne({ _id: req.params.id, patient: req.user._id });
  if (!t) throw new HttpError(404, 'Symptom check not found.');
  if (t.status === 'done') throw new HttpError(400, 'This check is finished. Start a new one.');
  const dbRules = await Rule.find().lean();
  const out = await runTurn({ session: t, text: content, rules: dbRules.length ? dbRules : DEFAULT_RULES });

  t.messages.push({ role: 'user', content }, { role: 'assistant', content: out.reply });
  t.language = out.language; t.slots = out.slots; t.markModified('slots');
  t.step = out.step; t.flags = out.flags || []; t.sources = out.sources || [];
  t.trace.push(...out.trace);
  if (out.done && out.result) {
    Object.assign(t, { status: 'done', urgency: out.result.urgency, reasons: out.result.reasons, department: out.result.department, confidence: out.result.confidence, engine: out.result.engine });
  }
  await t.save();
  res.json({ reply: out.reply, done: t.status === 'done', quick: t.status === 'done' ? [] : quickFor(t.step, t.language), language: t.language, step: t.step, slots: t.slots, urgency: t.urgency });
}));

r.get('/mine', wrap(async (req, res) => {
  const list = await Triage.find({ patient: req.user._id }).sort({ createdAt: -1 }).limit(20).select('slots urgency department status createdAt');
  res.json({ items: list });
}));

r.get('/:id', wrap(async (req, res) => {
  const t = await Triage.findById(req.params.id).populate('patient', 'name phone language');
  if (!t) throw new HttpError(404, 'Symptom check not found.');
  const own = String(t.patient._id) === String(req.user._id);
  if (!own && req.user.role === 'patient') throw new HttpError(403, 'You do not have access to this check.');
  res.json({ triage: t, quick: t.status === 'done' ? [] : quickFor(t.step, t.language) });
}));
export default r;
