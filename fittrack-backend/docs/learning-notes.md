# FitTrack — Learning Notes

Concepts, architecture, and the "why" behind every decision. Updated as we build.

---

## Project Reference

### Architecture

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

### Tech Stack

| Layer | Tool |
|---|---|
| Backend | Spring Boot 3, Spring Security, JPA/Hibernate |
| Frontend | React + Vite + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | JWT in HttpOnly cookie |
| Frontend Hosting | GitHub Pages |
| Backend Hosting | Render.com (cold start after 15min idle) |
| CI/CD | GitHub Actions → GHCR → Render deploy hook |
| Monitoring | Grafana Cloud + Prometheus + Loki |
| Code Quality | SonarQube Cloud |
| AI | Claude API (claude-sonnet-4-20250514) |

### Package Structure

```
com.fittrack.auth        → JWT, login, register
com.fittrack.workout     → CRUD, business logic
com.fittrack.webhook     → event firing, HMAC signing, delivery logs
com.fittrack.ai          → Claude API integration
com.fittrack.user        → User entity, Role enum
com.fittrack.config      → Security, beans
```

### Environment Variables

```
SUPABASE_DB_PASSWORD     → Supabase database password
JWT_SECRET               → Base64-encoded 32-byte signing key
JWT_EXPIRATION_MS        → Token lifetime in ms (e.g. 86400000 = 1 day)
ANTHROPIC_API_KEY        → Claude API key (Sprint 6+)
WEBHOOK_HMAC_SECRET      → HMAC signing secret (Sprint 7+)
```

Local dev: put secrets in `.env` (gitignored), export before running:
```bash
export $(cat .env | xargs) && ./mvnw spring-boot:run
```

Prod: set as environment variables on Render dashboard.

### Coding Conventions

- Controller → Service → Repository — never skip layers
- DTOs for all API request/response — never expose JPA entities directly
- Constructor injection only — never `@Autowired` field injection
- JWT in HttpOnly cookie — never localStorage
- `Optional` properly — never call `.get()` without `.isPresent()`
- Spring profiles: `dev` for local, `prod` for Render

---

## Sprint 1 — Spring Boot Setup + JWT Auth + Supabase

---

### Config Files

**What we built:**
- Deleted `application.properties` (Spring Initializr default)
- Created `application.yml` — base config for all environments
- `application-dev.yml` — local dev overrides (Supabase credentials)
- `application-prod.yml` — Render/production overrides

**Why 3 files?**
Spring merges them at runtime. `application.yml` is always loaded first.
Then Spring loads the profile-specific file on top, overriding anything that conflicts.
This way shared config (port, JPA settings) lives in one place, and secrets/URLs stay isolated per environment.

**Why YAML over `.properties`?**
Both work identically. YAML is nested so it's much easier to read when config grows large.
```yaml
# YAML — grouped, readable
spring:
  datasource:
    url: jdbc:postgresql://...
    username: postgres
```
```properties
# .properties — flat, repetitive
spring.datasource.url=jdbc:postgresql://...
spring.datasource.username=postgres
```

**Key settings in `application.yml`:**
| Setting | Value | Why |
|---|---|---|
| `profiles.active` | `dev` | Loads `application-dev.yml` by default locally |
| `ddl-auto` | `update` | Hibernate auto-creates/alters tables to match your entities |
| `show-sql` | `false` | Don't flood the console with SQL in normal runs |

**`ddl-auto` values to know:**
| Value | Behaviour | Use when |
|---|---|---|
| `update` | Create or alter tables to match entities | Local dev |
| `validate` | Check tables match entities, crash if not | Production |
| `create-drop` | Wipe and recreate on every restart | Testing only |

**Spring Profiles:**
- Locally: Spring uses `dev` profile → picks up `application-dev.yml`
- On Render: set env var `SPRING_PROFILES_ACTIVE=prod` → picks up `application-prod.yml`
- You never hardcode which profile is active in prod — you pass it as an environment variable

---

### Dependencies (pom.xml)

**What we added:**
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` — JWT library split into 3 jars

**Why 3 jars for JWT?**
- `jjwt-api` — public interfaces, your code imports from this
- `jjwt-impl` — internal engine, marked `runtime` so you can't accidentally import it
- `jjwt-jackson` — JSON serialization plugin, also `runtime`

---

### Maven Scopes — Compile Time vs Runtime

**Compile time** — when Maven turns `.java` files into `.class` files. All imports are resolved here. Missing dependency = build error before the app starts.

**Runtime** — when the app actually runs. The JVM loads and executes the bytecode. Errors here happen while running (`NullPointerException`, `ClassNotFoundException`, etc.).

> Compile time = proofreading a recipe before you cook.
> Runtime = actually cooking and discovering the oven is broken.

**Maven scope summary:**
| Scope | On compile classpath? | In final JAR? |
|---|---|---|
| `compile` (default) | Yes | Yes |
| `runtime` | No | Yes |
| `test` | Yes (tests only) | No |

**Why `postgresql` is `runtime`:**
You never import `org.postgresql.*` directly in your code. You use Spring's `DataSource` abstraction and the driver loads automatically underneath. Marking it `runtime` enforces that — Maven stops you from importing internals at compile time, but the driver is still packaged in the JAR.

---

### User Entity (`com.fittrack.user.User`)

**What we built:**
- `Role.java` — enum with `USER` and `ADMIN`
- `User.java` — JPA entity implementing `UserDetails`

**Why enum over String for Role?**
Enums restrict values to a known set. A `String` field lets typos like `"ADMNI"` slip through — the compiler won't catch it. `Role.ADMNI` fails immediately at compile time.

**JPA annotations on User:**
| Annotation | Purpose |
|---|---|
| `@Entity` | Marks this class as a DB table |
| `@Table(name = "users")` | Explicit table name — needed because `user` is a reserved word in PostgreSQL |
| `@Id` | Marks the primary key |
| `@GeneratedValue(strategy = GenerationType.IDENTITY)` | DB auto-increments the id |
| `@Enumerated(EnumType.STRING)` | Stores enum as `"USER"`/`"ADMIN"` string, not 0/1 number |

**Why `Long` not `int` for id?**
`Long` is nullable — important for JPA which needs to distinguish "no id yet" (null) from "id is 0". `int` can't be null.

**Lombok annotations:**
| Annotation | What it generates |
|---|---|
| `@Data` | All getters, setters, `equals()`, `hashCode()`, `toString()` |
| `@Builder` | `User.builder().email("x").password("y").build()` pattern |
| `@NoArgsConstructor` | Empty constructor — JPA requires this |
| `@AllArgsConstructor` | Constructor with all fields — required by `@Builder` |

**Why `implements UserDetails`?**
`UserDetails` is an interface from `spring-security-core`. Spring Security doesn't know anything about your `User` class — it only talks to `UserDetails`. By implementing it, you're bridging your domain object to Spring Security's world.

Key overrides:
- `getUsername()` → returns `email` (our login identifier)
- `getPassword()` → generated by Lombok from the `password` field
- `getAuthorities()` → wraps `Role` enum into `SimpleGrantedAuthority` for Spring Security's role checks
- The 4 boolean methods → all return `true` (no account locking/expiry features needed)

**The pattern:**
```
Spring Security ←→ UserDetails interface ←→ Your User entity
```
Spring Security is full of these extension points — implement the interface, override to fit your needs.

---

### UserRepository (`com.fittrack.user.UserRepository`)

**What we built:**
- `UserRepository.java` — a Spring Data JPA interface for database access on the `User` entity

**Why an interface, not a class?**
Spring Data JPA generates the implementation at startup automatically. You declare what you need, Spring builds the proxy that does the actual JDBC work. You write zero SQL.

**What `JpaRepository<User, Long>` gives you for free:**
| Method | What it does |
|---|---|
| `save(user)` | INSERT or UPDATE |
| `findById(id)` | SELECT by primary key, returns `Optional<User>` |
| `findAll()` | SELECT all rows |
| `deleteById(id)` | DELETE by primary key |
| `existsById(id)` | SELECT COUNT, returns boolean |

The two type parameters mean: `User` is the entity, `Long` is the type of its `@Id` field.

**Why `findByEmail` works without writing SQL:**
Spring parses the method name. `findBy` → SELECT, `Email` → WHERE email = ?. The parameter becomes the value. This is called **derived query methods** — Spring reads the name and generates the query.

**Why `Optional<User>` and not just `User`:**
A user with that email might not exist. If you return plain `User`, Spring returns `null` when not found and callers can forget to null-check — `NullPointerException` at runtime with no compile-time warning.

`Optional<User>` makes the "might not exist" case explicit in the type. The caller is forced to handle it:

```java
// Throw a meaningful exception (what we do in AuthService)
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

// Or check presence first
if (userRepository.findByEmail(email).isPresent()) { ... }
```

Convention: never call `.get()` on an Optional without checking `.isPresent()` first — that throws `NoSuchElementException`, which is just as bad as a NPE.

---

### JPA vs Hibernate vs Spring Data JPA — What's the Difference?

**JPA — Just a Specification**
JPA (Jakarta Persistence API) is not a library — it's a document. A set of rules that says how Java objects should map to database tables and what the API looks like. It defines the annotations (`@Entity`, `@Table`, `@Id`) and the core interface (`EntityManager`), but has no runnable code itself.

> Think of JPA like a job description — it says what needs to be done, not who does it.

**Hibernate — The Implementation**
Hibernate is the engine that actually implements the JPA spec. It does the real work: translates `@Entity` classes into SQL, manages connections, tracks which objects changed. When you write `@Entity` on `User.java`, Hibernate is what reads it and creates the `users` table. Spring Boot pulls Hibernate in automatically — you never call it directly.

> Hibernate is the chef following the JPA recipe.

**Spring Data JPA — The Convenience Layer**
Spring Data JPA sits above JPA/Hibernate and removes the remaining boilerplate. Without it, every query requires raw `EntityManager` code. With it, you declare method names and Spring generates the implementation at startup. It also provides `JpaRepository` with `save`, `findById`, `findAll`, etc. already built.

> Spring Data JPA is the sous-chef that preps everything so you only write what's unique.

**How they stack in FitTrack:**
```
Your Code  (UserRepository, entity annotations)
     ↓
Spring Data JPA  (generates queries, provides JpaRepository)
     ↓
JPA / EntityManager  (standard persistence API)
     ↓
Hibernate  (actually talks to the database)
     ↓
PostgreSQL Driver  (JDBC, sends SQL over the wire)
     ↓
Supabase PostgreSQL
```

---

### JwtService (`com.fittrack.auth.JwtService`)

**What it does:**
Three responsibilities — generate tokens, extract claims, validate tokens.

**What a JWT looks like:**
```
header.payload.signature
```
- `header` — algorithm used (HS256)
- `payload` — claims: `sub` (email), `iat` (issued at), `exp` (expiry)
- `signature` — HMAC of header+payload using `JWT_SECRET` — proves the token wasn't tampered with

The server never stores the token. Every request sends it, the server verifies the signature and reads the claims. That's what makes auth stateless.

**`@Value` annotation:**
```java
@Value("${jwt.secret}")
private String secretKey;
```
Injects a value from `application.yml` into the field at runtime. The chain is:
```
Environment variable (JWT_SECRET)
        ↓
Spring property: jwt.secret
        ↓
@Value("${jwt.secret}") → secretKey field
```

**The `extractClaim` generic method:**
```java
private <T> T extractClaim(String token, Function<Claims, T> claimsResolver)
```
`<T>` is a generic type parameter — a placeholder filled in at call time based on what function you pass. Lets one method handle any claim:
```java
extractClaim(token, Claims::getSubject);     // T = String
extractClaim(token, Claims::getExpiration);  // T = Date
```

**`getSigningKey()`:**
Decodes the Base64 secret from config into a cryptographic `Key`. JJWT uses this to sign tokens on generation and verify the signature on parse. If the secret doesn't match, parsing throws an exception — the token is rejected.

---

### ApplicationConfig (`com.fittrack.config.ApplicationConfig`)

**What it does:**
Wires up the three beans Spring Security needs to function before any request arrives.

**`UserDetailsService`:**
Spring Security interface with one method: `loadUserByUsername(String username)`. We implement it as a lambda — look up the user by email or throw `UsernameNotFoundException`. Bridge:
```
Spring Security → UserDetailsService → UserRepository → Database
```

**`PasswordEncoder` (BCrypt):**
One-way hashing for passwords. BCrypt adds a random salt so the same password hashes differently each time, but `matches()` still works. Deliberately slow — makes brute force impractical. Never use MD5/SHA for passwords.

**`DaoAuthenticationProvider`:**
Spring Security's built-in class for DB-backed authentication. You give it `UserDetailsService` (how to load a user) and `PasswordEncoder` (how to verify the password). During login it:
1. Loads the user from DB via `UserDetailsService`
2. Verifies the raw password against the stored hash via `PasswordEncoder`
3. Returns an authenticated token if both pass, throws if not

**`AuthenticationManager`:**
The single entry point for authentication. Exposed as a `@Bean` so `AuthService` can inject and call it manually during login:
```java
authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(email, password)
);
```

**How they all connect:**
```
POST /auth/login (email + password)
        ↓
AuthService calls AuthenticationManager
        ↓
AuthenticationManager → DaoAuthenticationProvider
        ↓
DaoAuthenticationProvider → UserDetailsService → loads User from DB
        ↓
DaoAuthenticationProvider → PasswordEncoder → verifies password
        ↓
Authentication passes → JwtService generates token → cookie set on response
```

---

### JwtAuthenticationFilter (`com.fittrack.auth.JwtAuthenticationFilter`)

**What it does:**
Intercepts every incoming HTTP request, checks for a JWT in the `Authorization` header, validates it, and if valid, stamps the current request as authenticated before it reaches any controller.

**Why `extends OncePerRequestFilter`?**
Spring's filter chain can theoretically call a filter more than once per request (e.g. during forwards or async dispatch). `OncePerRequestFilter` guarantees `doFilterInternal` runs exactly once per request.

**`doFilterInternal` — step by step:**

```
Step 1: Read Authorization header
  → Missing or not "Bearer ..." → pass through (login/register have no token)

Step 2: Extract token and username from it
  → Malformed/expired token → extractUsername throws → Spring returns 401

Step 3: Only proceed if username found AND request not already authenticated

Step 4: Load full user from DB, validate token
  → Valid → write UsernamePasswordAuthenticationToken into SecurityContextHolder
  → Invalid → skip (downstream security config will reject the request)

Step 5: Always call filterChain.doFilter() to continue the chain
```

**`SecurityContextHolder`:**
Thread-local storage Spring Security uses to track the current request's authentication. Setting auth here → every component can call `SecurityContextHolder.getContext().getAuthentication()` to know who is logged in. Cleared automatically after each request.

**The full picture:**
```
Incoming request
      ↓
JwtAuthenticationFilter
  → No token → pass through
  → Token found → validate → set SecurityContext
      ↓
SecurityConfig checks: public or protected endpoint?
  → Protected + not authenticated → 403
  → Public or authenticated → controller runs
```

---

### Auth DTOs (`com.fittrack.auth.dto`)

**What we built:**
- `RegisterRequest.java` — fields: `name`, `email`, `password`
- `LoginRequest.java` — fields: `email`, `password`
- `AuthResponse.java` — fields: `email`, `role`, `message`

**Why DTOs and not just the `User` entity?**
The `User` entity is a JPA object tied to the database — it contains `password` (hashed), internal fields like `id`, and Spring Security internals from implementing `UserDetails`. Returning it directly in an API response would expose all of that to the client. DTOs are purpose-built shapes: you put exactly what the caller needs, nothing more.

> Rule: entities cross the DB boundary, DTOs cross the API boundary. Never mix the two.

**`@Data` vs `@Builder` — when to use which:**
| Annotation | Generates | Use when |
|---|---|---|
| `@Data` | Getters, setters, `equals`, `hashCode`, `toString` | Spring/Jackson builds the object for you (deserialization) |
| `@Builder` | `MyClass.builder()...build()` pattern | You construct the object yourself in code |

`RegisterRequest` and `LoginRequest` use only `@Data` — Spring's Jackson library reads the incoming JSON body and calls setters to populate the fields. You never construct them manually.

`AuthResponse` uses `@Builder` because `AuthService` constructs it:
```java
AuthResponse.builder()
    .email(user.getEmail())
    .role(user.getRole().name())
    .message("Login successful")
    .build();
```

**Why no `token` field in `AuthResponse`?**
The JWT goes in an **HttpOnly cookie**, not the response body:
```
POST /api/auth/login
  → AuthService validates credentials
  → JwtService generates token
  → Set-Cookie: jwt=...; HttpOnly; SameSite=Strict  (on the HTTP response)
  → Body: { email, role, message }
```

HttpOnly means JavaScript cannot read the cookie — it's sent automatically by the browser on every request but invisible to `document.cookie`. If the token were in the body, the frontend might store it in `localStorage`, which any JS (including injected XSS scripts) can read.

---

### AuthService (`com.fittrack.auth.AuthService`)

**What it does:**
Business logic for register and login. Both methods accept `HttpServletResponse` so they can write the JWT cookie directly onto the HTTP response.

**`register` flow:**
```
1. Check if email exists → throw IllegalStateException if duplicate
2. Hash password with BCrypt via PasswordEncoder
3. Build and save User entity (role defaults to USER)
4. Generate JWT via JwtService
5. Write JWT as HttpOnly cookie on the response
6. Return AuthResponse (email, role, message)
```

**`login` flow:**
```
1. AuthenticationManager.authenticate() — delegates to DaoAuthenticationProvider
   → loads user from DB, verifies BCrypt hash
   → throws BadCredentialsException on failure
2. Reload User from DB (to get full entity, not just UserDetails)
3. Generate JWT via JwtService
4. Write JWT as HttpOnly cookie on the response
5. Return AuthResponse
```

**Why `ResponseCookie` instead of servlet `Cookie`?**
The servlet `Cookie` class has no `setSameSite()` method. `SameSite=Strict` tells browsers not to send the cookie on requests originating from other domains — this blocks CSRF attacks. `ResponseCookie` (Spring's class) supports it:
```java
ResponseCookie.from("jwt", token)
    .httpOnly(true)
    .secure(cookieSecure)   // false in dev, true in prod
    .path("/")
    .maxAge(Duration.ofDays(1))
    .sameSite("Strict")
    .build();
```

**`app.cookie.secure` from config:**
```java
@Value("${app.cookie.secure:false}")
private boolean cookieSecure;
```
The `:false` default means dev works over HTTP without any config. Set `app.cookie.secure=true` in `application-prod.yml` when we reach Sprint 5.

---

### The 403 on Duplicate Email — Why It Happens

When `AuthService.register()` throws `IllegalStateException`, Spring Boot tries to forward the request to `/error` to render the error. But `/error` isn't in the `permitAll()` list in `SecurityConfig` — Spring Security blocks it, returning **403** instead of the expected **500**.

Fix: a `GlobalExceptionHandler` (`@RestControllerAdvice`) intercepts exceptions before they reach the `/error` forwarding step and returns clean JSON directly. Next thing to build in Sprint 1.

---

*(More sections will be added as we progress through each sprint)*
