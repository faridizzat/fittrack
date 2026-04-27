# FitTrack — GitHub Copilot Instructions

## Project
Personal fitness tracker. Spring Boot 3 backend + React/Vite frontend.
Full context: `docs/project-context.md`

---

## Backend — Java / Spring Boot

### Always follow these patterns:
- Use constructor injection — never `@Autowired` field injection
- DTOs for all API request/response — never expose JPA entities directly
- Controller → Service → Repository — never skip layers
- Null-check all `Optional` — never call `.get()` without `.isPresent()`
- Use `ResponseEntity<?>` for all controller return types
- Annotate DTOs with Jakarta validation (`@NotBlank`, `@Email`, etc.)

### Auth is already implemented:
- JWT stored in HttpOnly cookie (access + refresh tokens)
- Do not suggest session-based auth or localStorage for tokens
- Spring Security config is in `SecurityConfig.java` — don't duplicate filters

### Naming conventions:
```java
// Controllers
@RestController
@RequestMapping("/api/workouts")
public class WorkoutController { }

// Services
@Service
public class WorkoutService { }

// Repositories
public interface WorkoutRepository extends JpaRepository<Workout, Long> { }

// DTOs
public record WorkoutRequest(@NotBlank String exercise, int sets, int reps) { }
public record WorkoutResponse(Long id, String exercise, int sets, int reps, LocalDate date) { }
```

### Environment variables — never hardcode:
```java
@Value("${anthropic.api.key}")
private String anthropicApiKey;
```

---

## Frontend — React / Vite / Tailwind

### Always follow these patterns:
- Functional components with hooks only — no class components
- API calls live in `src/services/` — not inline in components
- Use Tailwind utility classes only — no inline styles, no CSS modules
- Handle loading and error states for every API call

### Auth pattern:
- JWT is in HttpOnly cookie — you cannot access it in JS (that's intentional)
- Use an `AuthContext` for user state
- Protected routes use a `PrivateRoute` wrapper component

### Component naming:
```jsx
// Pages (full page views)
src/pages/Dashboard.jsx
src/pages/Login.jsx

// Reusable components
src/components/WorkoutCard.jsx
src/components/ProgressChart.jsx
```

---

## What Copilot should NOT suggest:
- Session-based auth or JWT in localStorage
- `@Autowired` field injection in Java
- Inline API calls inside React components
- Hardcoded secrets or API keys anywhere
- Business logic inside controllers
- Exposing JPA entities directly in API responses
