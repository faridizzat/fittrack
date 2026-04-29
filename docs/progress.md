# FitTrack — Sprint Progress

A personal fitness tracker built to learn CI/CD and DevOps deeply.

---

## Sprint Plan

| Sprint | Focus | Status |
|---|---|---|
| 1 | Spring Boot setup, JWT auth (register/login), Supabase PostgreSQL | ✅ Done |
| 2 | Workout CRUD endpoints, React frontend scaffold | 🔄 In progress |
| 3 | Dockerize backend, docker-compose for local dev | ⬜ Not started |
| 4 | GitHub Actions CI (build + test + SonarQube) | ⬜ Not started |
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

### Tested

- Backend CRUD endpoints ready (not yet tested with actual requests)

### Still to do

- React frontend scaffold (Vite, Tailwind, React Router, API client, stub pages)
- Test all endpoints with Postman / curl

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
