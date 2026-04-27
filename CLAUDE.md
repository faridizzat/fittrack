# FitTrack — Claude Instructions

## What is this project?
A personal fitness tracker built to learn CI/CD and DevOps deeply.
Full context: `docs/project-context.md`

---

## Stack (Quick Reference)
- **Backend**: Spring Boot 3, Spring Security, JPA/Hibernate
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (access + refresh tokens, stored in HttpOnly cookie)
- **AI**: Claude API (`claude-sonnet-4-20250514`)
- **Hosting**: GitHub Pages (frontend) + Render (backend)
- **CI/CD**: GitHub Actions → GHCR → Render deploy hook

---

## Run Locally

```bash
# Backend
cd fittrack-backend
./mvnw spring-boot:run

# Frontend
cd fittrack-frontend
npm install
npm run dev

# Both via Docker
docker-compose up
```

---

## Coding Conventions
- Controller → Service → Repository (never skip layers)
- DTOs for all API request/response (never expose JPA entities directly)
- Constructor injection only — never `@Autowired` field injection
- JWT stored in HttpOnly cookie, never localStorage
- Always null-check `adaptTo()` results
- Use `Optional` properly — never call `.get()` without `.isPresent()`
- Spring profiles: `dev` for local, `prod` for Render

## Package Structure
```
com.fittrack.auth        → JWT, login, register
com.fittrack.workout     → CRUD, business logic
com.fittrack.webhook     → event firing, HMAC signing, delivery logs
com.fittrack.ai          → Claude API integration
com.fittrack.user        → User entity, Role enum
com.fittrack.config      → Security, beans
```

---

## Environment Variables
```
SUPABASE_URL
SUPABASE_DB_PASSWORD
JWT_SECRET
JWT_EXPIRATION_MS
ANTHROPIC_API_KEY
WEBHOOK_HMAC_SECRET
```
Never hardcode these. Always load from environment or `application-prod.yml`.

---

## Branch Naming
```
feature/sprint-1-auth
feature/sprint-2-workout-crud
feature/sprint-3-docker
fix/jwt-refresh-token
```

---

## Current Sprint
Check `docs/project-context.md` → Sprint Plan table for current status.

---

## What NOT to do
- Don't suggest session-based auth — we use stateless JWT
- Don't expose JPA entities in API responses — always use DTOs
- Don't use `@Autowired` field injection — use constructor injection
- Don't hardcode secrets — use environment variables
- Don't put business logic in controllers — it belongs in services
