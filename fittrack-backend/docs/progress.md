# FitTrack — Sprint Progress

A personal fitness tracker built to learn CI/CD and DevOps deeply.

**Learning Approach (Sprint 3+):** Interactive step-by-step teaching. Show code → ask questions → wait for confirmation → move to next topic. Goal: deep understanding, not just copying code.

---

## Sprint Plan

| Sprint | Focus | Status |
|---|---|---|
| 1 | Spring Boot setup, JWT auth (register/login), Supabase PostgreSQL | ✅ Done |
| 2 | Workout CRUD endpoints, React frontend scaffold | ✅ Done |
| 3 | Dockerize backend, docker-compose for local dev | ✅ Done |
| 4 | GitHub Actions CI (build + test + SonarQube) | 🟡 In Progress |
| 5 | CD pipeline — push Docker image, deploy to Render, deploy hook | ⬜ Not started |
| 6 | AI Coach feature (Tier 1) — Claude API integration | ⬜ Not started |
| 7 | Webhook feature + AI insight on completion (Tier 2) | ⬜ Not started |
| 8 | Grafana Cloud monitoring, Prometheus metrics, Loki logs | ⬜ Not started |
| 9 | AI Workout Generator (Tier 3) + SonarQube polish | ⬜ Not started |
| 10 | GitHub Pages frontend deploy, README, live demo | ⬜ Not started |

---

## Sprint 1 — Spring Boot Setup + JWT Auth + Supabase

**Branch:** `feature/sprint-1-auth`

### What we built

| File | Purpose |
|---|---|
| `application.yml` | Base config (port, JPA settings, active profile) |
| `application-dev.yml` | Dev overrides — Supabase connection URL |
| `application-prod.yml` | Prod overrides — to be filled during Sprint 5 |
| `Role.java` | Enum with `USER` and `ADMIN` |
| `User.java` | JPA entity implementing `UserDetails` — fields: id, name, email, password, role |
| `UserRepository.java` | Spring Data JPA interface — `findByEmail()` |
| `JwtService.java` | Generates, validates, and extracts claims from JWT tokens |
| `ApplicationConfig.java` | Spring beans: `UserDetailsService`, `PasswordEncoder`, `AuthenticationProvider`, `AuthenticationManager` |
| `JwtAuthenticationFilter.java` | Filter that reads JWT from `Authorization` header and stamps requests as authenticated |
| `SecurityConfig.java` | Permits `/api/auth/**`, requires auth on everything else, stateless session |
| `RegisterRequest.java` | DTO: name, email, password |
| `LoginRequest.java` | DTO: email, password |
| `AuthResponse.java` | DTO: email, role, message |
| `AuthService.java` | Business logic: register (hash + save + JWT), login (authenticate + JWT) |
| `AuthController.java` | `POST /api/auth/register`, `POST /api/auth/login` |
| `.env` | Local secrets — gitignored |
| `.env.example` | Template — safe to commit |

### Key decisions

- **JWT in HttpOnly cookie** — JS cannot read it, eliminating the XSS vector that localStorage has
- **`ResponseCookie` over servlet `Cookie`** — only Spring's `ResponseCookie` supports the `SameSite` attribute (CSRF protection)
- **`app.cookie.secure` injected from config** — `false` in dev (HTTP), `true` in prod (HTTPS), no code change needed
- **`name` added to `User` entity** — `RegisterRequest` had it but `User` didn't; fixed during AuthService build
- **Constructor injection** — no `@Autowired` field injection anywhere

### Tested

- `POST /api/auth/register` → 200, JWT cookie set, user created in Supabase ✅
- `POST /api/auth/login` → 200, JWT cookie set ✅
- Duplicate email → 403 (known issue — `/error` endpoint not permitted, see below)

### Still to do

- ~~`GlobalExceptionHandler`~~ ✅ Done — `DuplicateEmailException` → 409, `AuthenticationException` → 401

---

## Sprint 3 — Dockerize Backend & Docker Compose

**Branch:** `feature/sprint-3-docker` (merged to master)

### What we built

| File | Purpose |
|---|---|
| `fittrack-backend/Dockerfile` | Multi-stage build: Maven compile → JRE runtime |
| `fittrack-frontend/Dockerfile` | Node image with Vite dev server |
| `docker-compose.yml` | Orchestrate backend + frontend locally |
| `.dockerignore` (both) | Exclude build artifacts, git files |

### Key concepts learned

- **Multi-stage builds**: Builder stage (Maven + compile) → Runtime stage (JRE + JAR only)
- **Docker layer caching**: Order matters (dependencies before code changes)
- **Service networking**: Inside Docker, `backend:8080` instead of `localhost:8080`
- **Environment variables**: docker-compose reads from `.env` file for local dev
- **Security**: .env is for local dev only; production uses secret managers (Sprint 5)
- **Monorepo structure**: Both backend and frontend in single repo for easier orchestration

### Status

- ✅ Dockerfiles created and tested (backend multi-stage, frontend Vite server)
- ✅ docker-compose.yml configured with service networking
- ✅ Both backend and frontend code in monorepo at https://github.com/faridizzat/fittrack
- ✅ Merged to master branch
- ⏳ Full integration testing deferred to Render deployment (Podman Windows networking limitation)

---

## Sprint 2 — Workout CRUD + React Frontend Scaffold

**Branch:** `feature/sprint-2-workout-crud`

### What we built (Backend)

| File | Purpose |
|---|---|
| `WorkoutType.java` | Enum: `CARDIO`, `STRENGTH`, `FLEXIBILITY` |
| `Workout.java` | JPA entity — id, user, name, type, durationMins, notes, createdAt |
| `WorkoutRepository.java` | Spring Data JPA — `findAllByUserId()`, `findByIdAndUserId()` |
| `CreateWorkoutRequest.java` | DTO: name, type, durationMins, notes |
| `UpdateWorkoutRequest.java` | DTO: name, type, durationMins, notes (all optional) |
| `WorkoutResponse.java` | DTO: id, name, type, durationMins, notes, createdAt |
| `WorkoutService.java` | CRUD: create, findAll, findById, update, delete |
| `WorkoutController.java` | REST: `POST /api/workouts`, `GET /api/workouts`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| `WorkoutNotFoundException.java` | Exception → 404 handler |
| `GlobalExceptionHandler.java` | Updated with 404 handler for missing workouts |

### Key decisions

- **Ownership check baked into queries** — `findByIdAndUserId()` prevents users from accessing others' workouts
- **`@AuthenticationPrincipal User`** — Spring injects the authenticated user directly into controller methods
- **Immutable DTOs as records** — no setter noise, clear contracts
- **Soft updates** — null fields in `UpdateWorkoutRequest` mean "don't change"

### Frontend Built

| File | Purpose |
|---|---|
| `vite.config.js` | Vite config with dev proxy to backend |
| `tailwind.config.js`, `postcss.config.js` | Tailwind CSS setup |
| `src/main.jsx` | React entry point with BrowserRouter |
| `src/App.jsx` | Routing: `/`, `/login`, `/register`, `/workouts` |
| `src/api/client.js` | API client for auth and workout CRUD |
| `src/components/Layout.jsx` | Nav bar with auth state |
| `src/components/WorkoutForm.jsx` | Create/edit workout form |
| `src/components/WorkoutList.jsx` | Workouts table with edit/delete actions |
| `src/pages/` | Home, Login, Register, Workouts, NotFound pages |

### Key fixes

- **JWT from cookies**: Updated `JwtAuthenticationFilter` to read JWT from both Authorization header and cookies
- **CORS enabled**: Added CORS config allowing `localhost:5173` with credentials
- **Env vars**: Added `DotenvInitializer` to load `.env` file at startup
- **Full CRUD UI**: Create, read, update (edit), delete all working end-to-end

### Tested

- ✅ Register → JWT cookie set
- ✅ Login → JWT cookie set  
- ✅ Create workout → saved to DB
- ✅ List workouts → owned by user
- ✅ Edit workout → updated in DB
- ✅ Delete workout → removed from DB

---

## Sprint 4 — GitHub Actions CI Pipeline

**Branch:** `feature/sprint-4-ci`

### What we built

| File | Purpose |
|---|---|
| `application-test.yml` | Test profile with H2 in-memory DB (MODE=PostgreSQL for Hibernate compatibility) |
| `pom.xml` | Added H2 test-scoped dependency + Jacoco plugin for coverage reporting |
| `FittrackBackendApplicationTests.java` | Added `@ActiveProfiles("test")` to activate test profile |
| `.github/workflows/ci.yml` | GitHub Actions workflow: checkout → Java 21 setup → build → test → coverage → SonarCloud |

### Key concepts learned

- **Test profile isolation** — `application-test.yml` provides H2 datasource while prod uses Supabase; `@ActiveProfiles("test")` switches profiles for test context
- **H2 compatibility** — `MODE=PostgreSQL` flag allows H2 to accept Hibernate's PostgreSQL-flavored DDL (table generation)
- **Jacoco coverage** — Maven plugin generates `jacoco.xml` during `verify` phase; SonarCloud reads this for coverage gates
- **Workflow triggers** — `on: push` and `on: pull_request` with `working-directory: fittrack-backend` for monorepo structure
- **Git root vs project root** — `.github/workflows/` goes at git root (`Project 2026/`), not at Maven project root
- **File permissions in git** — `mvnw` needs `git update-index --chmod=+x` to be executable on Linux CI runners

### Current status

- ✅ Build step passes — Maven compiles and tests with H2
- ✅ Test step passes — `FittrackBackendApplicationTests` context loads successfully
- ✅ Jacoco report generated — `target/site/jacoco/jacoco.xml` created
- 🟡 SonarCloud analysis — pending `SONAR_TOKEN` secret setup on GitHub
- ⏳ Branch protection rules — ready to configure after first successful run

### Still to do

- Set up SonarCloud account + project (at sonarcloud.io)
- Add `SONAR_TOKEN` as GitHub Actions secret
- Configure branch protection rules (require "Build, Test, and Analyze" status check)
- (Optional) Add Quality Gate badge to README

---

## DevOps Concepts by Sprint

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
