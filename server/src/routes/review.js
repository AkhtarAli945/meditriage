import { Router } from 'express';
import { z } from 'zod';
import { Triage } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap, HttpError, URGENCY_RANK } from '../util.js';

const r = Router();
r.use(requireAuth, requireRole('doctor', 'admin'));
r.get('/queue', wrap(async (req, res) => {
  const items = await Triage.find({ status: 'done' }).sort({ createdAt: -1 }).limit(60).populate('patient', 'name phone');
  items.sort((a, b) => (URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]) || (b.createdAt - a.createdAt));
  res.json({ items });
}));
r.patch('/:id', wrap(async (req, res) => {
  const d = z.object({ action: z.enum(['approve', 'override']), urgency: z.enum(['emergency', 'urgent', 'routine']).optional() }).parse(req.body);
  if (d.action === 'override' && !d.urgency) throw new HttpError(400, 'Choose the urgency to set.');
  const t = await Triage.findById(req.params.id);
  if (!t) throw new HttpError(404, 'Symptom check not found.');
  t.review = { status: d.action === 'approve' ? 'approved' : 'overridden', by: req.user._id, urgency: d.urgency, at: new Date() };
  await t.save();
  res.json({ triage: t });
}));
export default r;
