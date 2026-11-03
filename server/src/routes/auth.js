import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { wrap, HttpError } from '../util.js';

const r = Router();
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, language: u.language });

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(80),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
  language: z.enum(['en', 'ur']).default('en'),
  consentAi: z.literal(true, { errorMap: () => ({ message: 'You must consent to AI-assisted processing to continue.' }) }),
  consentShare: z.boolean().default(false),
});

r.post('/register', wrap(async (req, res) => {
  const d = registerSchema.parse(req.body);
  if (await User.exists({ email: d.email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
  const user = await User.create({
    name: d.name, email: d.email, phone: d.phone, language: d.language, role: 'patient',
    passwordHash: await bcrypt.hash(d.password, 12),
    consent: { aiProcessing: true, shareWithDoctor: d.consentShare, at: new Date() },
  });
  res.status(201).json({ token: signToken(user), user: pub(user) });
}));

r.post('/login', wrap(async (req, res) => {
  const d = z.object({ email: z.string().trim().email('Enter a valid email address.'), password: z.string().min(1, 'Enter your password.') }).parse(req.body);
  const user = await User.findOne({ email: d.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(d.password, user.passwordHash))) throw new HttpError(401, 'Email or password is incorrect.');
  res.json({ token: signToken(user), user: pub(user) });
}));

r.get('/me', requireAuth, (req, res) => res.json({ user: pub(req.user) }));
export default r;
