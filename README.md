# SmartEnergy — AI Home Energy Management System

A production-grade home energy management system with real-time simulation, analytics, and AI-powered insights.

---

## Architecture

```
Simulation Worker (TypeScript, every 5s)
        │
        ▼
     BullMQ (energy-write queue)
        │
        ▼
  DB Consumer ──► PostgreSQL 16
        │            (energy_readings, energy_daily, devices…)
        │ (on success)
        ▼
  Redis Pub/Sub
        │
        ▼
  WebSocket Gateway ──► Angular Frontend (live charts, alerts)
        
  NestJS REST API ──► Analytics Engine (TypeScript domain)
                               │
                               ▼
                      AI Text Layer (Ollama / Mock)
                      explains results — never calculates
```

---

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 20+ (for local development)

### 1. Clone & configure

```bash
git clone <repo>
cd smart-energy
cp .env.example backend/.env.dev       # then edit the secrets inside
```

Minimum required values in `backend/.env.dev`:

```env
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=smartenergy
JWT_SECRET=change-me-in-production
AI_MOCK=true
```

### 2. Start the stack

```bash
docker-compose up --build
```

Services:
| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:4200            |
| API       | http://localhost:3000            |
| Swagger   | http://localhost:3000/api/docs   |
| PostgreSQL| localhost:5433                   |
| Redis     | localhost:6380                   |

### 3. Run database migrations

```bash
cd backend
npm run migration:run
```

### 4. Start with Ollama (optional — real AI)

```bash
docker-compose --profile ai up --build
docker exec -it smart-energy-ollama-1 ollama pull llama3.1:8b
```

Then set `AI_MOCK=false` in `backend/.env.dev` and restart.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Simulation Worker

```bash
cd backend
npm run start:worker
```

### Frontend

```bash
cd frontend
npm install
npm start          # http://localhost:4201
```

---

## Running Tests

### Backend (Jest — 33 tests)

```bash
cd backend
npm test
```

### Frontend (Vitest — 10 tests)

```bash
cd frontend
npm test -- --watch=false
```

---

## API Reference

Full interactive docs at **http://localhost:3000/api/docs** (Swagger UI).

Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login → JWT access token + refresh cookie |
| POST | `/auth/refresh` | Silent token rotation |
| GET | `/devices` | List user's devices |
| POST | `/devices` | Create device |
| GET | `/energy/readings` | Time-series readings (raw/hourly/daily) |
| GET | `/energy/summary` | Aggregated summary (day/week/month) |
| GET | `/energy/recent` | Last 720 readings for dashboard seed |
| GET | `/tariffs` | Current tariff config |
| POST | `/tariffs` | Update tariff rates |
| GET | `/automations` | List automation rules |
| POST | `/automations` | Create automation rule |
| DELETE | `/automations/:id` | Delete rule |
| GET | `/ai/insight` | Pre-built AI insight for dashboard |
| POST | `/ai/chat` | Conversational AI about energy data |
| GET | `/health` | System health (DB, Redis, uptime) |

---

## Project Structure

```
smart-energy/
├── backend/
│   └── src/
│       ├── domain/
│       │   ├── contracts.ts          # shared TypeScript interfaces
│       │   ├── simulation/           # TariffEngine, SolarCurveModel, EnergyCalculator
│       │   └── analytics/            # AnomalyDetector, CostForecaster, PatternAnalyzer
│       ├── infrastructure/
│       │   ├── database/             # TypeORM config, migrations
│       │   ├── redis/                # ioredis module
│       │   ├── bullmq/               # single queue module
│       │   ├── config/               # Joi env validation
│       │   └── logger/               # Winston structured logger
│       └── modules/
│           ├── auth/                 # JWT auth, roles, guards
│           ├── users/                # user entity + service
│           ├── devices/              # device CRUD
│           ├── energy/               # readings, aggregates, consumer
│           ├── gateway/              # Socket.IO WebSocket
│           ├── tariffs/              # IEC tariff config
│           ├── automations/          # rule engine
│           ├── aggregation/          # hourly/daily cron jobs
│           ├── ai/                   # AI text layer (Ollama/Mock)
│           └── health/               # health check endpoint
├── frontend/
│   └── src/app/
│       ├── core/
│       │   ├── services/             # auth, websocket, theme services
│       │   ├── guards/               # auth guard
│       │   ├── interceptors/         # JWT interceptor
│       │   └── i18n/                 # Hebrew/English translations
│       ├── store/
│       │   └── energy.store.ts       # Angular Signals state
│       └── pages/
│           ├── login/                # login page
│           ├── dashboard/            # live gauges + charts
│           ├── devices/              # device control panel
│           ├── automations/          # rule builder
│           ├── ai/                   # chat + insight card
│           └── settings/             # tariff configuration
├── docker-compose.yml
├── .github/workflows/ci.yml          # CI: lint → test → build
├── ARCHITECTURE.md
├── SYSTEM_GUARANTEES.md
└── CLAUDE.md
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_USER` | Yes | — | PostgreSQL username |
| `DB_PASSWORD` | Yes | — | PostgreSQL password |
| `DB_NAME` | Yes | — | Database name |
| `DB_HOST` | Yes | `postgres` (Docker) | DB host |
| `DB_PORT` | No | `5432` | DB port |
| `REDIS_HOST` | Yes | `redis` (Docker) | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `AI_MOCK` | No | `false` | Use mock AI provider |
| `OLLAMA_URL` | No | `http://ollama:11434` | Ollama base URL |
| `OLLAMA_MODEL` | No | `llama3.1:8b` | Model name |

---

## Key Design Decisions

- **AI is text-only**: the Analytics Engine (pure TypeScript) handles all numerical work. AI receives pre-computed results and explains them in Hebrew.
- **Simulation is deterministic**: given the same timestamp and device config, output is always the same — makes unit testing straightforward.
- **No `synchronize: true`**: all schema changes go through TypeORM migrations so production data is never at risk.
- **Single BullMQ queue**: sufficient for MVP scale (one household, ~10 devices). Queue depth and sharding are deferred until real load exists.
- **Pub/Sub ordering**: Redis is published only *after* a successful DB write — the frontend never sees data that wasn't persisted.

---

## CI/CD

GitHub Actions runs on every push and pull request:

- **backend-ci**: ESLint → Jest (33 tests) → `tsc` build
- **frontend-ci**: ESLint → Vitest (10 tests) → `ng build`

See [.github/workflows/ci.yml](.github/workflows/ci.yml).
