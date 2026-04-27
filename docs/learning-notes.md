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

*(More sections will be added as we progress through each sprint)*
