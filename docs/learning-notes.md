# FitTrack — Learning Notes

A running log of what we built, why we built it that way, and key concepts explained along the way.

---

## Sprint 1 — Spring Boot Setup + JWT Auth + Supabase

---

### Config Files

**What we built:**
- Deleted `application.properties` (Spring Initializr default)
- Created `application.yml` — base config for all environments
- `application-dev.yml` — local dev overrides (to be filled with Supabase credentials)
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
// Throw a meaningful exception (what we'll do in AuthService)
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

// Or check first
if (userRepository.findByEmail(email).isPresent()) { ... }
```

Convention from CLAUDE.md: never call `.get()` on an Optional without checking `.isPresent()` first — that throws `NoSuchElementException`, which is just as bad as a NPE.

---

---

### JPA vs Hibernate vs Spring Data JPA — What's the Difference?

These three are often confused because they stack on top of each other.

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

### Is JPA/Hibernate Required in Spring Boot?

No — Spring Boot is just a framework, persistence is a separate concern you plug in. Alternatives:

| Option | What it is | Use when |
|---|---|---|
| **Spring Data JDBC** | Simpler Spring Data, no Hibernate, plain SQL for complex queries | Want control without ORM magic |
| **JOOQ** | Type-safe SQL in Java — typos in table/column names caught at compile time | SQL control without string queries |
| **JdbcTemplate** | Raw SQL strings, Spring handles connection boilerplate | Maximum control, fully predictable |
| **MyBatis** | SQL in XML/annotations bound to Java methods | Enterprise preference, explicit mapping |

**Why we use JPA/Hibernate in FitTrack:**
- Industry default — you'll see it in most Spring Boot jobs
- CRUD for `User`, `Workout` etc. takes minutes with `JpaRepository`
- `ddl-auto: update` means Hibernate creates/alters tables automatically during dev
- Spring Security + JPA entity is a well-worn pattern with tons of examples

If this were a high-throughput system with complex reporting queries, JOOQ or plain JDBC would be worth considering. For a learning project with straightforward entities, JPA is the right call.

---

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
application.yml → jwt.secret: ${JWT_SECRET}
        ↓
@Value("${jwt.secret}") → secretKey field
```
Keeps config centralised in yml — you can override per environment or swap the source later without touching Java code.

**The `extractClaim` generic method:**
```java
private <T> T extractClaim(String token, Function<Claims, T> claimsResolver)
```
`<T>` is a generic type parameter — a placeholder filled in at call time based on what function you pass. Lets one method handle any claim:
```java
extractClaim(token, Claims::getSubject);     // T = String
extractClaim(token, Claims::getExpiration);  // T = Date
```
Without it, you'd need a separate method for every field you want to extract.

**Method references (`Claims::getSubject`):**
Shorthand for a lambda. These are identical:
```java
claims -> claims.getSubject()   // lambda
Claims::getSubject              // method reference
```
Fits `Function<Claims, T>` — takes a `Claims`, returns something.

**`getSigningKey()`:**
Decodes the Base64 secret from config into a cryptographic `Key`. JJWT uses this to sign tokens on generation and verify the signature on parse. If the secret doesn't match, parsing throws an exception — the token is rejected.

---

### ApplicationConfig (`com.fittrack.config.ApplicationConfig`)

**What it does:**
Wires up the three beans Spring Security needs to function before any request arrives.

**`@Configuration`:**
Tells Spring this class is a source of bean definitions. Spring scans it at startup and runs all `@Bean` methods.

**`@Bean`:**
Marks a method as a bean factory. Spring calls it once at startup, stores the returned object in the **application context** (a shared registry). Anywhere that needs a `PasswordEncoder`, Spring pulls the same instance out — you never call `new` manually.

**`UserDetailsService`:**
Spring Security interface with one method: `loadUserByUsername(String username)`. We implement it as a lambda — look up the user by email or throw `UsernameNotFoundException`. This is the bridge:
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

Note: in Spring Security 6+ (Spring Boot 3.x), pass `UserDetailsService` directly to the constructor — the no-arg constructor is deprecated.

**`AuthenticationManager`:**
The single entry point for authentication. Receives credentials and delegates to the registered `AuthenticationProvider`. Exposed as a `@Bean` so `AuthService` can inject and call it manually during login:
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
Authentication passes → JwtService generates token → returned to client
```

---

### JwtAuthenticationFilter (`com.fittrack.auth.JwtAuthenticationFilter`)

**What it does:**
Intercepts every incoming HTTP request, checks for a JWT in the `Authorization` header, validates it, and if valid, stamps the current request as authenticated before it reaches any controller.

**Why `extends OncePerRequestFilter`?**
Spring's filter chain can theoretically call a filter more than once per request (e.g. during forwards or async dispatch). `OncePerRequestFilter` is a base class that guarantees `doFilterInternal` runs exactly once per request — no double-processing.

**What is the filter chain?**
Spring Security processes every request through a sequence of filters before it reaches your controller. Each filter does its job, then calls `filterChain.doFilter(request, response)` to pass control to the next filter. If you don't call it, the request stops there. `JwtAuthenticationFilter` sits in this chain — it validates the token and then passes the request along.

**`doFilterInternal` — step by step:**

```java
String authHeader = request.getHeader("Authorization");
if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    filterChain.doFilter(request, response);
    return;
}
```
Step 1-2: Read the `Authorization` header. If missing or not a Bearer token → pass through immediately. Public endpoints (login, register) won't have a token — this lets them through.

```java
String token = authHeader.substring(7);
String username = jwtService.extractUsername(token);
```
Step 3-4: Strip `"Bearer "` (7 chars) to get the raw token. Extract the `sub` (email) from it. If the token is malformed or expired, `extractUsername` throws — Spring handles the exception and returns 401.

```java
if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
```
Step 5: Only proceed if we got a username AND the request isn't already authenticated. Prevents re-authenticating on the same request.

```java
    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
    if (jwtService.isTokenValid(token, userDetails)) {
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
```
Step 6: Load the full user from DB. Validate the token (email matches + not expired). If valid, create a `UsernamePasswordAuthenticationToken` — Spring Security's object representing an authenticated user. The three arguments: principal (user), credentials (null — we don't store the password here), authorities (roles). Attach request metadata with `setDetails`. Write it into `SecurityContextHolder` — this marks the request as authenticated for the rest of the filter chain and the controller.

```java
filterChain.doFilter(request, response);
```
Always call this at the end to continue the chain — whether auth succeeded or not. The security config will block the request later if it reaches a protected endpoint without auth.

**`SecurityContextHolder`:**
Thread-local storage Spring Security uses to track the current request's authentication. Setting auth here → every component (controllers, services) can call `SecurityContextHolder.getContext().getAuthentication()` to know who is logged in. Cleared automatically after each request.

**The full picture:**
```
Incoming request
      ↓
JwtAuthenticationFilter.doFilterInternal()
  → No token → pass through (login/register endpoints)
  → Token found → validate → set SecurityContext
      ↓
Rest of filter chain
      ↓
SecurityConfig checks: is this endpoint public or protected?
  → Protected + not authenticated → 403
  → Public or authenticated → controller runs
```

---

*(More sections will be added as we progress through each sprint)*
