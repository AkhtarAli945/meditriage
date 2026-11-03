import 'dotenv/config';
export const config = {
  port: process.env.PORT || 5000,
  mongo: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meditriage',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  groqKey: process.env.GROQ_API_KEY || '',
  model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
};
