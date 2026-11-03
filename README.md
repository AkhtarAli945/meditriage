# MediTriage — AI Patient Intake & Triage Agent (MERN + LangGraph)

Patients describe symptoms in a chat (English or Urdu). A LangGraph agent asks follow-ups, runs
**deterministic emergency rules first**, retrieves guidelines, scores urgency (emergency / urgent / routine),
and the patient books a suggested doctor. Doctors review and approve or override. Admins manage rules and see analytics and agent traces.

## Stack
- **Client:** React 18 + Vite + Tailwind + React Router (responsive: mobile, tablet, laptop, large screens; English/Urdu with RTL)
- **Server:** Node + Express + Mongoose, JWT auth, RBAC (patient / doctor / admin), Zod validation, Helmet, rate limits
- **Agent:** LangGraph.js — `intake → red-flag rules → (emergency | ask next | retrieve → score → finalize)`
- **LLM:** Groq (free tier) via `@langchain/groq`, default model `llama-3.3-70b-versatile`. With no key, or if Groq rate-limits, the agent falls back to a rule-based scorer so the demo still works.

## Run it
Requires Node 18+ and MongoDB (local, `docker compose up -d`, or Atlas).

```bash
# 1) API
cd server
cp .env.example .env        # set MONGODB_URI, JWT_SECRET, optional GROQ_API_KEY (free at console.groq.com)
npm install
npm run dev                 # starts on :5000 and seeds rules, doctors and demo logins

# 2) Web (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :5000)
```

### Demo logins (created automatically)
| Role | Email | Password |
|---|---|---|
| Patient | patient@meditriage.test | Patient@12345 |
| Doctor | dr.khan@meditriage.test | Doctor@12345 |
| Admin | admin@meditriage.test | Admin@12345 |

Or create your own patient with **Sign up**. Change or delete the demo accounts before any real deployment.

## Languages
The chat accepts English and Urdu in the same conversation. Each reply follows the language of the patient's latest message (Urdu script is detected automatically; emergency rules also cover common Roman Urdu phrases).

## Pages
`/` landing · `/signup` · `/signin` · `/app` patient dashboard · `/app/check` triage chat · `/app/result/:id` result ·
`/app/book` booking · `/doctor` review queue · `/admin` analytics, safety log, rules, agent traces, integrations

## Try the safety rules
Type "chest pain and sweating" in the chat: the rules fire before any AI and the result is EMERGENCY.
Admins can switch rules on/off under Admin → Rules.

## Production checklist
- Set a long random `JWT_SECRET`, `CLIENT_URL`, and use MongoDB Atlas with backups.
- Replace `server/src/agent/guidelines.js` with real clinical guidelines (e.g. Atlas Vector Search) and have clinicians approve the emergency rules.
- Set `VITE_EMERGENCY_NUMBER` for your country (default 1122).
- Add HTTPS, a privacy policy, data retention rules and clinical sign-off. This software is a decision-support demo, not a medical device.
- Next steps: n8n/WhatsApp reminders, EMR (FHIR) sync, Langfuse tracing, tests and CI.

## Layout
```
server/src  agent/ (graph, redFlags, guidelines, llm)  models/  routes/  middleware/  seed.js  index.js
client/src  pages/  components/  lib/ (api, auth, i18n)
```
