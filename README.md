# novanurachman.my.id

Personal profile site with a built-in CMS. Live at **https://novanurachman.my.id**

## Stack

| Layer | Choice |
| --- | --- |
| Backend | Go + Fiber v2 (port 8084) |
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Database | MySQL (`nova_profile`) |
| Auth | JWT, bcrypt password hashing |
| Serving | nginx → Go; hashed assets served by nginx directly |

## Layout

```
backend/
  cmd/server/         entrypoint + routes
  internal/
    database/         connection pool
    handlers/         public API, admin CRUD, auth, SPA meta injection
    middleware/       JWT guard
  migrations/         schema + seed SQL
frontend/
  src/
    pages/public/     Home, Projects, Experience, Skills, Contact
    pages/admin/      Login, Dashboard, Profile, CrudPage, Contacts
    components/       layouts, nav, footer, shared UI
    lib/              api client, auth context, types
```

## CMS modules

Profile · Projects · Experience · Skills · Messages

Content is read from the database at request time, so edits in the CMS appear
immediately — no rebuild or redeploy needed.

## Local development

```bash
# Backend (needs backend/.env)
cd backend && go run ./cmd/server

# Frontend (proxies /api to :8084)
cd frontend && npm install && npm run dev
```

## Design system

"Minimalist Developer", dark-first:

- Background `#08090B` with a very low-contrast grid texture
- Single accent `#4ADE80` (terminal green)
- Inter for prose, JetBrains Mono for labels and metadata
- 44px minimum touch targets; focus rings are never removed
- `prefers-reduced-motion` respected

## Deployment

`git push origin main` triggers `.github/workflows/deploy.yml`, which builds
both halves in CI and rsyncs the artifacts to the VPS. **Nothing is ever built
on the server.**

Required repository secrets:

| Secret | Purpose |
| --- | --- |
| `VPS_HOST` | server address |
| `VPS_USER` | ssh user |
| `VPS_SSH_KEY` | private key for deploys |

## Notes

- Admin CRUD writes only **whitelisted columns**; column names never come from
  the request body, so a payload cannot reach unintended fields.
- Login returns the same message for an unknown email and a wrong password, so
  it cannot be used to discover registered addresses.
- HTML is served with `no-cache` while hashed assets are `immutable` for a year;
  this combination is what makes a new deploy visible immediately without
  stale-bundle errors.
- `<title>`, description, and Open Graph tags are injected per route by the Go
  backend from the `seo_meta` table (and from the project row on detail pages).
