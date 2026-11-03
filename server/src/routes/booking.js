import { Router } from 'express';
import { z } from 'zod';
import { Doctor, Appointment } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap, HttpError } from '../util.js';

export const doctors = Router();
doctors.use(requireAuth);
doctors.get('/', wrap(async (req, res) => {
  const s = (req.query.specialty || '').toString().trim();
  let list = s ? await Doctor.find({ specialty: new RegExp(s.replace(/[^\w ]/g, ''), 'i') }) : [];
  if (!list.length) list = await Doctor.find();
  res.json({ items: list });
}));
doctors.get('/:id/slots', wrap(async (req, res) => {
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
  const d = await Doctor.findById(req.params.id);
  if (!d) throw new HttpError(404, 'Doctor not found.');
  const taken = (await Appointment.find({ doctor: d._id, date, status: 'booked' })).map((a) => a.time);
  res.json({ slots: d.slots.map((time) => ({ time, available: !taken.includes(time) })) });
}));

export const appointments = Router();
appointments.use(requireAuth);
const bookSchema = z.object({
  doctorId: z.string().min(1), triageId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().min(4), mode: z.enum(['clinic', 'video']).default('clinic'),
});
appointments.post('/', requireRole('patient'), wrap(async (req, res) => {
  const d = bookSchema.parse(req.body);
  const doc = await Doctor.findById(d.doctorId);
  if (!doc || !doc.slots.includes(d.time)) throw new HttpError(400, 'That time is not offered by this doctor.');
  const today = new Date().toISOString().slice(0, 10);
  const max = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  if (d.date < today || d.date > max) throw new HttpError(400, 'Pick a date within the next 30 days.');
  try {
    const a = await Appointment.create({ patient: req.user._id, doctor: doc._id, triage: d.triageId || undefined, date: d.date, time: d.time, mode: d.mode });
    res.status(201).json({ appointment: a });
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, 'Someone just booked that slot. Pick another time.');
    throw e;
  }
}));
appointments.get('/mine', wrap(async (req, res) => {
  const items = await Appointment.find({ patient: req.user._id }).populate('doctor', 'name specialty').sort({ date: 1, time: 1 });
  res.json({ items });
}));
appointments.patch('/:id/cancel', wrap(async (req, res) => {
  const a = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!a) throw new HttpError(404, 'Appointment not found.');
  a.status = 'cancelled'; await a.save();
  res.json({ appointment: a });
}));
