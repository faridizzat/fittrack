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

*(More sections will be added as we progress through each sprint)*
