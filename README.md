# MoneyMaker Aviator

A production-grade, real-time crash/multiplier betting game (Aviator-style), built with a
**server-authoritative game engine**, a Django/Channels backend, and a React/Vite frontend.

> The server is the single source of truth for balances, bets, cash-outs, multipliers, and
> crash points. The frontend never determines a financial outcome — it only renders one.

---

## 1. What we're building

| Concern | Owner |
|---|---|
| Round lifecycle, crash point, multiplier math | Backend — Game Engine |
| Deposits, withdrawals, balances, ledger | Backend — Wallet Engine |
| Live round/multiplier/bet/cashout events | Backend — WebSocket Engine (Django Channels) |
| Plane animation, particles, camera, UI feedback | Frontend — React Animation Layer |

Currency for the demo environment is **KES (KSh)**, using `Decimal` end-to-end — never floats
or JS numbers for money.

---

## 2. Tech stack

**Backend:** Python, Django, Django REST Framework, Django Channels, Redis, PostgreSQL,
JWT auth (SimpleJWT), Celery (background jobs), `channels-redis` (channel layer).

**Frontend:** React, Vite, JavaScript (no TypeScript), React Router, Axios, native
WebSocket API, Bootstrap Icons, custom CSS (no Tailwind/UI kits).

---

## 3. Repository layout

```text
moneymaker/
│
├── README.md
├── .env.example
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   └── api/
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── consumers.py
│       ├── routing.py
│       ├── services.py
│       ├── game_engine.py
│       ├── wallet.py
│       ├── fairness.py
│       ├── permissions.py
│       ├── validators.py
│       ├── tasks.py
│       └── migrations/
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── main.jsx
    ├── services/api.js
    ├── components/
    ├── pages/
    ├── style/main.css
    ├── context/
    └── hooks/
```

---

## 4. Game round lifecycle

```text
WAITING → BETTING_OPEN → RUNNING → CRASHED → SETTLED → (next round)
```

- **WAITING** — brief pause after settlement, next round is scheduled.
- **BETTING_OPEN** — fixed countdown window; players place bets; crash point is already
  committed (hashed) server-side but not revealed.
- **RUNNING** — multiplier climbs deterministically from server-elapsed time; players can
  cash out; server validates every cash-out against the live authoritative multiplier.
- **CRASHED** — crash point reached; no further cash-outs accepted; server seed revealed.
- **SETTLED** — payouts written to the ledger, round archived, provably-fair record finalized.

---

## 5. Provably-fair design

```text
server_seed (secret) + client_seed + nonce → HMAC-SHA256 → crash_multiplier
```

- `server_seed_hash` (SHA-256 of the secret seed), `client_seed`, and `nonce` are stored and
  visible **before** the round starts.
- The raw `server_seed` is revealed only **after** the round crashes.
- Anyone can recompute the crash point from the revealed seed via
  `POST /api/v1/aviator/fairness/verify/`.
- The crash point is never recalculated or altered once betting opens.

---

## 6. Core API surface (Phase-built, see §8)

```text
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/token/refresh/

GET    /api/v1/me/
GET    /api/v1/wallet/
GET    /api/v1/wallet/transactions/

GET    /api/v1/aviator/current-round/
GET    /api/v1/aviator/history/
POST   /api/v1/aviator/bet/
POST   /api/v1/aviator/cashout/
GET    /api/v1/aviator/my-bets/
POST   /api/v1/aviator/fairness/verify/

WS     /ws/aviator/
```

---

## 7. Environment variables

`.env.example` (backend):

```env
SECRET_KEY=
DEBUG=True
DATABASE_URL=postgres://moneymaker:moneymaker@localhost:5432/moneymaker
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=
```

`.env.example` (frontend):

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws/aviator/
```

---

## 8. Build order (we will do these one at a time)

| Phase | Deliverable |
|---|---|
| 1 | Django project + `api` app skeleton, Postgres/Redis config, ASGI, JWT, CORS |
| 2 | User authentication (register/login/refresh/me) |
| 3 | Wallet + transaction ledger models & services |
| 4 | Aviator game models (Round, Bet, FairnessRecord) |
| 5 | Provably-fair engine (`fairness.py`) |
| 6 | Game round engine (`game_engine.py`) — state machine, multiplier math |
| 7 | Django Channels + Redis channel layer wiring |
| 8 | WebSocket protocol (`consumers.py`, `routing.py`) |
| 9 | Betting engine (place bet, validations, idempotency) |
| 10 | Cash-out engine with row-locking & concurrency protection |
| 11 | React app scaffold (Vite, routing, contexts) |
| 12 | WebSocket integration in React (`useWebSocket`, `GameContext`) |
| 13 | Plane animation (`requestAnimationFrame`, canvas/SVG) |
| 14 | Wallet/history UI pages |
| 15 | Tests (auth, wallet, betting, cash-out, game engine, WebSocket) & security pass |

Each phase will be delivered with: file path(s), complete code, explanation, install
command, migration command (if any), test command, expected result, and common
errors/fixes — before moving to the next phase.

---

## 9. Non-negotiable rules (enforced throughout)

- Crash point is **never** computed in React.
- Frontend balance/multiplier/payout are **never** trusted — only server responses are.
- All money uses `Decimal`, never float/JS `Number`, on the backend and in DB columns.
- Every bet/cash-out carries a client-generated `request_id` for idempotency.
- Cash-out and settlement paths use `transaction.atomic()` + `select_for_update()`.
- PostgreSQL is the durable source of truth for financial state; Redis is for the channel
  layer, caching, and coordination only.

---

## 10. Running locally (filled in as phases land)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Frontend
cd frontend
npm install
npm run dev
```

(Exact commands will be confirmed as each phase is delivered.)

---

## 11. Status

- [x] README / architecture plan
- [ ] Phase 1 — Django project + api app skeleton
- [ ] Phase 2 — Authentication
- [ ] Phase 3 — Wallet engine
- [ ] Phase 4 — Aviator models
- [ ] Phase 5 — Fairness engine
- [ ] Phase 6 — Game round engine
- [ ] Phase 7 — Channels + Redis
- [ ] Phase 8 — WebSocket protocol
- [ ] Phase 9 — Betting engine
- [ ] Phase 10 — Cash-out engine
- [ ] Phase 11 — React scaffold
- [ ] Phase 12 — WebSocket integration
- [ ] Phase 13 — Plane animation
- [ ] Phase 14 — Wallet/history UI
- [ ] Phase 15 — Tests & security