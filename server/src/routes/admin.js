import { Router } from 'express';
import { z } from 'zod';
import { Triage, Appointment, Rule, Doctor } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap, HttpError } from '../util.js';

const r = Router();
r.use(requireAuth, requireRole('admin'));

r.get('/stats', wrap(async (req, res) => {
  const since = new Date(Date.now() - 7 * 864e5);
  const done = await Triage.find({ status: 'done', createdAt: { $gte: since } }).select('urgency createdAt review');
  const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en', { weekday: 'short' }), count: 0 }; });
  const mix = { emergency: 0, urgent: 0, routine: 0 };
  let reviewed = 0, overridden = 0;
  for (const t of done) {
    const d = days.find((x) => x.key === t.createdAt.toISOString().slice(0, 10)); if (d) d.count++;
    mix[t.urgency]++;
    if (t.review?.status !== 'pending') reviewed++;
    if (t.review?.status === 'overridden') overridden++;
  }
  res.json({
    total: done.length, emergencies: mix.emergency, mix, days,
    overrideRate: reviewed ? Math.round((overridden / reviewed) * 100) : 0,
    appointments: await Appointment.countDocuments({ status: 'booked' }), doctors: await Doctor.countDocuments(),
  });
}));

r.get('/safety-log', wrap(async (req, res) => {
  const items = await Triage.find({ status: 'done', $or: [{ urgency: 'emergency' }, { confidence: { $lt: 0.7 } }, { 'review.status': 'overridden' }] })
    .sort({ createdAt: -1 }).limit(30).select('urgency flags confidence review createdAt engine');
  res.json({ items });
}));
r.get('/traces', wrap(async (req, res) => {
  const items = await Triage.find({ 'trace.0': { $exists: true } }).sort({ createdAt: -1 }).limit(15).select('trace urgency confidence engine createdAt status');
  res.json({ items });
}));
r.get('/rules', wrap(async (req, res) => res.json({ items: await Rule.find().sort({ createdAt: 1 }) })));
r.patch('/rules/:id', wrap(async (req, res) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
  const rule = await Rule.findByIdAndUpdate(req.params.id, { enabled }, { new: true });
  if (!rule) throw new HttpError(404, 'Rule not found.');
  res.json({ rule });
}));
export default r;
