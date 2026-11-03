import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  language: { type: String, enum: ['en', 'ur'], default: 'en' },
  consent: { aiProcessing: Boolean, shareWithDoctor: Boolean, at: Date },
}, opts));

export const Doctor = model('Doctor', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String, specialty: String, experience: Number, fee: Number,
  slots: { type: [String], default: ['09:00', '10:30', '16:30', '18:00'] },
}, opts));

export const Triage = model('Triage', new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  language: { type: String, default: 'en' },
  messages: [{ role: String, content: String, at: { type: Date, default: Date.now } }],
  slots: { type: Schema.Types.Mixed, default: {} },
  step: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'done'], default: 'active' },
  urgency: { type: String, enum: ['emergency', 'urgent', 'routine', null], default: null },
  reasons: [String], department: String, confidence: Number,
  flags: [String], sources: [String], engine: String,
  trace: [{ node: String, ms: Number, note: String }],
  review: { status: { type: String, default: 'pending' }, by: { type: Schema.Types.ObjectId, ref: 'User' }, urgency: String, at: Date },
}, opts));

export const Appointment = model('Appointment', new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  triage: { type: Schema.Types.ObjectId, ref: 'Triage' },
  date: { type: String, required: true }, time: { type: String, required: true },
  mode: { type: String, enum: ['clinic', 'video'], default: 'clinic' },
  status: { type: String, enum: ['booked', 'cancelled', 'done'], default: 'booked' },
}, opts));

export const Rule = model('Rule', new Schema({
  key: { type: String, unique: true }, label: String, pattern: String,
  level: { type: String, default: 'emergency' }, advice: String, enabled: { type: Boolean, default: true },
}, opts));
// One active booking per doctor slot
Appointment.schema.index({ doctor: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { status: 'booked' } });
