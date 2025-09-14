# Multi-tenant SaaS Notes (React + Express)

This app implements a beginner-friendly, production-ready multi-tenant Notes SaaS with React (frontend), Express (backend), JWT auth, role-based access, and subscription gating. Theme is white + lavender with Tailwind and Framer Motion.

## Multi-tenancy Approach

- Approach: Shared schema with a tenantId column on every multi-tenant table (tenants, users, notes).
- Isolation: All queries are scoped by `tenantId`, enforced in API handlers with JWT-derived context.
- Tenants created by default: `Acme (slug: acme)` and `Globex (slug: globex)`.

This approach keeps operations simple and cost-effective while still providing strict isolation (no cross-tenant reads/writes). It’s easy to migrate to schema-per-tenant or database-per-tenant later if needed.

## Auth & Roles

- JWT-based login (`POST /api/auth/login`) and signup (`POST /api/auth/signup`).
- Roles:
  - Admin: invite users, upgrade subscription.
  - Member: CRUD notes only.
- Seeded accounts (password: `password`):
  - admin@acme.test (Admin, Acme)
  - user@acme.test (Member, Acme)
  - admin@globex.test (Admin, Globex)
  - user@globex.test (Member, Globex)

## Subscription Gating

- Plans: Free (max 3 notes per tenant), Pro (unlimited).
- Upgrade: `POST /api/tenants/:slug/upgrade` (Admin only). Stripe is integrated in test mode when `STRIPE_SECRET` is provided; in CI/no-key scenarios, the endpoint still upgrades for immediate effect.

## API Summary

- Health: `GET /health` → `{ status: "ok" }`
- Auth: `POST /api/auth/login`, `POST /api/auth/signup`
- Users: `POST /api/tenants/:slug/invite` (Admin)
- Tenants: `GET /api/tenants/me`, `POST /api/tenants/:slug/upgrade` (Admin)
- Notes: `POST /api/notes`, `GET /api/notes`, `GET /api/notes/:id`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`

## Frontend

- Minimal, clean UI with white + lavender theme.
- Login using predefined accounts, notes list/create/delete, and “Upgrade to Pro” when Free limit is reached.

## Database

- The code ships with an in-memory store by default for quick start and automated tests.
- To use PostgreSQL, set `DATABASE_URL` and connect a Neon/Postgres instance. You can manage this via MCP: click [Open MCP popover](#open-mcp-popover) and connect to Neon. Then replace repository functions with `pg` queries as needed.

## Deployment (Vercel)

- Backend and frontend are Vercel-ready.
- To deploy via MCP, click [Open MCP popover](#open-mcp-popover) and connect to Vercel. Then run the deployment tools.
- Ensure these environment variables in Vercel:
  - `JWT_SECRET`
  - `STRIPE_SECRET` (optional, enables Stripe test PaymentIntents)
  - `DATABASE_URL` (optional, enables Postgres)

## CORS

- Enabled globally in Express.

