import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User, Doctor, Rule } from './models/index.js';
import { DEFAULT_RULES } from './agent/redFlags.js';

export async function seedRules() {
  for (const r of DEFAULT_RULES) await Rule.updateOne({ key: r.key }, { $setOnInsert: r }, { upsert: true });
}
async function upsertUser(email, name, role, password) {
  let u = await User.findOne({ email });
  if (!u) u = await User.create({ email, name, role, phone: '03000000000', passwordHash: await bcrypt.hash(process.env.DEMO_PASSWORD || password, 12), consent: { aiProcessing: true, shareWithDoctor: true, at: new Date() } });
  return u;
}
export async function seedAll() {
  await seedRules();
  await upsertUser('admin@meditriage.test', 'Clinic Admin', 'admin', 'Admin@12345');
  await upsertUser('patient@meditriage.test', 'Demo Patient', 'patient', 'Patient@12345');
  const docs = [
    ['dr.khan@meditriage.test', 'Dr. A. Khan', 'Cardiology', 12, 3000],
    ['dr.memon@meditriage.test', 'Dr. S. Memon', 'General Physician', 8, 1500],
    ['dr.shah@meditriage.test', 'Dr. R. Shah', 'Pediatrics', 10, 2000],
    ['dr.baloch@meditriage.test', 'Dr. N. Baloch', 'Dermatology', 6, 2000],
  ];
  for (const [email, name, specialty, experience, fee] of docs) {
    const u = await upsertUser(email, name, 'doctor', 'Doctor@12345');
    await Doctor.updateOne({ user: u._id }, { $setOnInsert: { user: u._id, name, specialty, experience, fee } }, { upsert: true });
  }
}
if (process.argv[1]?.endsWith('seed.js')) {
  await mongoose.connect(config.mongo);
  await seedAll();
  console.log('Seeded. Logins: admin@meditriage.test / Admin@12345, dr.khan@meditriage.test / Doctor@12345, patient@meditriage.test / Patient@12345');
  await mongoose.disconnect();
}
