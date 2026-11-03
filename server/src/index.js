import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { config } from './config.js';
import auth from './routes/auth.js';
import triage from './routes/triage.js';
import { doctors, appointments } from './routes/booking.js';
import review from './routes/review.js';
import admin from './routes/admin.js';
import { seedAll } from './seed.js';
import { llmAvailable } from './agent/llm.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('tiny'));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 40, message: { error: 'Too many attempts. Try again in a few minutes.' } }));

app.get('/api/health', (req, res) => res.json({ ok: true, llm: llmAvailable() ? 'groq' : 'rule-based fallback' }));
app.use('/api/auth', auth);
app.use('/api/triage', triage);
app.use('/api/doctors', doctors);
app.use('/api/appointments', appointments);
app.use('/api/review', review);
app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Check your input.' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id.' });
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

await mongoose.connect(config.mongo);
await seedAll(); // idempotent: safety rules, demo doctors and logins
app.listen(config.port, () => console.log(`API on :${config.port} · agent engine: ${llmAvailable() ? 'Groq LLM + rules' : 'rule-based fallback'}`));
