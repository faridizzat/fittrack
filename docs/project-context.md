# FitTrack — Master Project Context

## Overview
A personal fitness tracker web app built to learn CI/CD and DevOps deeply.
Secondary goals: useful daily life app and portfolio piece.

## Developer Context
- Junior AEM developer (since 2025), bootcamp background
- Familiar with: Java, Spring concepts, React basics, Docker basics, GitHub
- Already built: Kenali Ikan (Claude Vision API), TaskMind (Spring Boot + OpenAI)
- Preferred IDE: VS Code + IntelliJ IDEA
- Location: Malaysia

---

## Core Features
- User registration/login (JWT auth with access + refresh tokens)
- Two roles: `USER` and `ADMIN`
- Log workouts (exercise, sets, reps, weight, date)
- View progress over time (charts)
- Admin can view all users' activity
- Webhook system — fires on workout completion (HMAC-signed payload)
- AI Coach — analyzes user's actual workout logs, gives personalized suggestions
- AI Workout Generator — generates structured workout plan from user input
- AI Insight — auto-generates motivational insight after each workout, stored in DB

---

## Tech Stack

| Layer | Tool | Free? |
|---|---|---|
| Backend | Spring Boot 3, Spring Security, JPA/Hibernate | ✅ |
| Frontend | React + Vite + Tailwind CSS | ✅ |
| Database | Supabase (PostgreSQL) | ✅ No expiry |
| Auth | JWT (access + refresh tokens) | ✅ |
| Frontend Hosting | GitHub Pages | ✅ Permanent, no sleep |
| Backend Hosting | Render.com (free tier) | ✅ Cold start after 15min idle |
| CI/CD | GitHub Actions (public repo) | ✅ Unlimited minutes |
| Container Registry | GitHub Container Registry (GHCR) | ✅ |
| Monitoring | Grafana Cloud free tier | ✅ Forever |
| Logging | Grafana Loki (included in Grafana Cloud) | ✅ |
| Code Quality | SonarQube Cloud free tier | ✅ |
| AI | Claude API (claude-sonnet-4-20250514) | ⚠️ Pay-per-use (cents for hobby) |

---

## Architecture

```
[React Frontend — GitHub Pages]
        │
        ▼
[Spring Boot API — Render]
        │
        ├── Auth Service (JWT)
        ├── Workout Service (CRUD)
        ├── Webhook Service (fires on workout completion, HMAC-signed)
        └── AI Service ──► Claude API
                │
                ▼
           [Supabase PostgreSQL]
                │
                ▼
      [Prometheus /actuator/prometheus]
                │
                ▼
      [Grafana Cloud — metrics, logs, alerts]
```

---

## Project Structure (Backend)

```
fittrack-backend/
├── src/main/java/com/fittrack/
│   ├── auth/
│   │   ├── AuthController.java
│   │   ├── AuthService.java
│   │   ├── JwtService.java
│   │   └── dto/
│   ├── workout/
│   │   ├── WorkoutController.java
│   │   ├── WorkoutService.java
│   │   ├── WorkoutRepository.java
│   │   ├── Workout.java
│   │   └── dto/
│   ├── webhook/
│   │   ├── WebhookService.java
│   │   └── WebhookDeliveryLog.java
│   ├── ai/
│   │   └── AiCoachService.java
│   ├── user/
│   │   ├── User.java
│   │   └── Role.java (USER, ADMIN)
│   └── config/
│       ├── SecurityConfig.java
│       └── ApplicationConfig.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
└── Dockerfile
```

## Project Structure (Frontend)

```
fittrack-frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/      ← API calls
│   └── main.jsx
├── public/
│   └── 404.html       ← SPA routing fix for GitHub Pages
├── vite.config.js
└── tailwind.config.js
```

---

## CI/CD Pipeline

```
Push to main
    │
    ├── Frontend pipeline:
    │       Vite build → Deploy to GitHub Pages (actions/deploy-pages@v4)
    │
    └── Backend pipeline:
            Maven build + unit tests
            → SonarQube Cloud scan
            → Docker multi-stage build
            → Push to GitHub Container Registry (GHCR)
            → Deploy to Render via deploy hook (webhook)
```

---

## Webhook Feature
- Trigger: user completes a workout
- FitTrack POSTs a signed JSON payload to a configured URL
- Payload signed with HMAC-SHA256 (`X-FitTrack-Signature` header)
- Receiver must verify signature before processing
- Use cases: Slack/Discord notification, Zapier/Make.com, AI insight trigger
- Retry logic + delivery logs stored in DB

### Webhook Payload Example
```json
{
  "event": "workout.completed",
  "userId": "user-123",
  "workout": {
    "exercise": "Kettlebell Swing",
    "sets": 4,
    "reps": 20
  },
  "timestamp": "2026-04-25T10:00:00Z"
}
```

---

## AI Features

### Tier 1 — AI Workout Coach
- User requests feedback after logging workouts
- Spring Boot builds prompt with real workout data as context
- Claude returns personalized weekly suggestion
- Endpoint: `POST /api/ai/coach`

### Tier 2 — Webhook + AI Insight (Auto)
- Workout completion → fires webhook + triggers AI insight generation
- Short motivational/analytical insight stored in DB
- Shown on user dashboard automatically

### Tier 3 — AI Workout Generator
- User inputs: goal (lose weight / build strength / endurance), equipment, duration
- Claude returns structured JSON workout plan
- Saved to user profile
- Endpoint: `POST /api/ai/generate-workout`

### AI Prompt Pattern
```java
String prompt = """
    User workout log (last 7 days):
    %s

    Generate a personalized suggestion for next week.
    Return ONLY valid JSON: { "summary": "", "nextWeekPlan": [...] }
    """.formatted(workoutData);
```

---

## Sprint Plan

| Sprint | Focus | Status |
|---|---|---|
| 1 | Spring Boot setup, JWT auth (register/login), Supabase PostgreSQL | ⬜ Not started |
| 2 | Workout CRUD endpoints, React frontend scaffold | ⬜ Not started |
| 3 | Dockerize backend, docker-compose for local dev | ⬜ Not started |
| 4 | GitHub Actions CI (build + test + SonarQube) | ⬜ Not started |
| 5 | CD pipeline — push Docker image, deploy to Render, deploy hook | ⬜ Not started |
| 6 | AI Coach feature (Tier 1) — Claude API integration | ⬜ Not started |
| 7 | Webhook feature + AI insight on completion (Tier 2) | ⬜ Not started |
| 8 | Grafana Cloud monitoring, Prometheus metrics, Loki logs | ⬜ Not started |
| 9 | AI Workout Generator (Tier 3) + SonarQube polish | ⬜ Not started |
| 10 | GitHub Pages frontend deploy, README, live demo | ⬜ Not started |

---

## Key DevOps Concepts to Learn Per Sprint

| Sprint | DevOps Concept |
|---|---|
| 3 | Docker multi-stage builds, docker-compose networking |
| 4 | CI pipeline, branch protection rules, quality gates |
| 5 | CD pipeline, secrets management, environment variables, deploy hooks |
| 6 | External API secrets, graceful degradation |
| 7 | Event-driven architecture, HMAC signing |
| 8 | Observability — metrics, logs, alerts, dashboards |
| 9 | Code quality gates, security scanning |
| 10 | Static site deployment, SPA routing fix |

---

## Coding Conventions
- Controller → Service → Repository pattern (never skip layers)
- DTOs for all API request/response (never expose JPA entities directly)
- Constructor injection only (never `@Autowired` field injection)
- JWT stored in HttpOnly cookie (not localStorage)
- Spring Boot profiles: `dev` for local, `prod` for Render
- Feature branches: `feature/sprint-1-auth`, `feature/sprint-2-workout-crud`
- All secrets via environment variables — never hardcoded

## Environment Variables (Backend)
```
SUPABASE_URL=
SUPABASE_DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRATION_MS=
ANTHROPIC_API_KEY=
WEBHOOK_HMAC_SECRET=
```

---

## Known Free Tier Limitations
- **Render**: backend sleeps after 15min idle → ~30s cold start on first request
- **Grafana Cloud free**: 14-day retention, 10k metric series, 50GB logs
- **SonarQube Cloud free**: unlimited public repos, private up to 50k lines of code
- **GitHub Actions free**: unlimited minutes for public repos
- **Claude API**: not free, hobby usage ~cents/month

---

## Progress Log
*(Update this at the end of each sprint)*

- No sprints completed yet. Project just initialized.
```
