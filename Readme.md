# ET Saathi 🤝
### AI-Powered Personal Concierge for Economic Times

> Built for ET AI Hackathon 2026 | Problem Statement 7 — AI Concierge for ET

---

## What is ET Saathi?

ET Saathi is an AI concierge that understands who you are in a single conversation and becomes your personal guide to everything ET offers. Instead of users discovering only 10% of ET's ecosystem, ET Saathi profiles each user intelligently and maps them to the right ET products — ET Prime, ET Markets, Masterclasses, Wealth Summits, and Financial Services.

---

## The Problem

- ET has a massive ecosystem — but most users never discover it fully
- No personalisation — every user sees the same homepage
- Financial products are scattered — users don't know what's relevant to them
- No guidance for new users on where to start

## The Solution

A 3-minute AI profiling conversation that:
1. Understands the user's financial life, goals, and interests
2. Maps them to the right ET products
3. Builds a personalised dashboard and onboarding path
4. Remembers context across sessions and keeps getting smarter

---

## Features

- **Smart Profiling Chat** — Conversational AI that asks the right questions naturally
- **Hindi Voice Support** — Users can speak in Hindi using Web Speech API
- **Personalised Dashboard** — Custom feed based on user profile (investor, student, entrepreneur, etc.)
- **ET Product Recommendations** — Routes users to ET Prime, Markets, Masterclasses, or Services
- **Financial Life Navigator** — Understands goals, risk appetite, and existing investments
- **Cross-Sell Engine** — Proactively suggests relevant ET services at the right moment
- **Memory Across Sessions** — Remembers user preferences and updates profile over time

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  Chat Widget | Dashboard | Voice Input  │
└────────────────┬────────────────────────┘
                 │ REST / WebSocket
┌────────────────▼────────────────────────┐
│       Backend + Agent Layer             │
│                   (FastAPI)             │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │       Orchestrator Agent         │   │
│  └──┬───────┬────────┬──────────┬───┘   │
│     │       │        │          │       │
│  Profiling Routing Content  Memory      │
│  Agent    Agent   Agent    Agent        │
│                                         │
│  Finance Agent | Cross-sell Agent       │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │    LLM Layer (Groq)     │   │
│  └──────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│             Data Layer                  │
│  MongoDB | Redis | Vector DB | ET JSON  │
└─────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI |
| AI Agents | custom agent loop |
| LLM | Groq API (Llama 3.3) |
| Database | MongoDB |
| Session Store | Redis |
| Vector Search | FAISS / Pinecone |
| Voice Input | Web Speech API |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Setup Instructions

### Installation

```bash
# Clone the repository
git clone https://github.com/Jbansal2/et-ai-concierge.git
cd et-ai-concierge

# Backend setup
cd backend

# Create & activate a virtualenv (Windows PowerShell)
python -m venv venv
./venv/Scripts/Activate.ps1

# Install Python deps
pip install -r requirements.txt

# Create .env (kept local; git-ignored)
copy .env.example .env
# Add your GROQ_API_KEY in backend/.env

# Start backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://localhost:27017/et-saathi
REDIS_URL=redis://localhost:6379
PORT=8000
```

---

## How It Works

1. **User opens ET** → Welcome concierge starts a friendly chat
2. **Profiling Agent** → Asks 5-6 smart questions (goals, income, interests, risk appetite)
3. **Profile is built** → Stored in MongoDB with vector embeddings
4. **Routing Agent** → Maps profile to relevant ET products
5. **Personalised Dashboard** → User sees a custom homepage
6. **Memory Agent** → Updates profile on every interaction
7. **Cross-sell Agent** → Suggests new ET services based on behaviour

---

## Agent Descriptions

| Agent | Role |
|-------|------|
| **Orchestrator** | Decides which agent handles each user message |
| **Profiling Agent** | Conducts the onboarding conversation, extracts structured profile |
| **Routing Agent** | Maps user profile to ET products using rule-based + LLM logic |
| **Content Agent** | Fetches and ranks relevant ET articles/content for the user |
| **Memory Agent** | Persists user history, updates profile over time |
| **Finance Agent** | Provides goal-based financial guidance and ET tool suggestions |
| **Cross-sell Agent** | Identifies upsell opportunities based on usage patterns |

---

## Demo

[Link to 3-minute pitch video] — *Coming soon*

---

## Built With

- [Groq](https://console.groq.com) — Fast LLM inference (free tier)
- [LangChain](https://langchain.com) — Agent orchestration
- [React](https://react.dev) — Frontend UI
- [MongoDB Atlas](https://mongodb.com/atlas) — Database

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Submitted for ET AI Hackathon 2026 | Problem Statement 7*