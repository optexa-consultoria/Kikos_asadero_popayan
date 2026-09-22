---
name: backend-dev-guidelines
description: "Backend rules for this project: Express 4 (ESM JavaScript) in backend/ plus Supabase (Postgres, Auth, Storage) accessed from the browser. Covers where logic belongs (RLS vs server), secrets and env vars, folder structure as the server grows, validation, error handling and security. Use when touching backend/server.js, adding an API route or middleware, handling secrets/keys, deciding whether something needs a server endpoint, or wiring Supabase access ('crea un endpoint', 'agrega una ruta', 'el backend', 'variables de entorno')."
risk: critical
source: community (adapted for Asadero Kikos)
date_added: "2026-02-27"
---

# Backend Development Guidelines — Asadero Kikos

**(Node.js · Express 4 · ESM JavaScript · Supabase)**

You are a senior backend engineer on a **small, real business site**. Aim for code that is secure, predictable and easy for one person to maintain. Right-size the architecture: no microservice ceremony, but no shortcuts on security.

---

## 1. How the system actually works (read first)

```
Browser (frontend/*.html + js/*.js)
   │  supabase-js v2 (CDN) with the PUBLISHABLE key  →  Supabase: productos, pedidos_log, Storage "productos-imagenes", Auth
   │
   └─ Orders are sent to WhatsApp (wa.me link built in js/cart.js)

backend/server.js (Express)  →  serves frontend/ statically for local dev + clean-URL fallbacks
Production: Vercel serves frontend/ as a static site (frontend/vercel.json)
```

Consequences:

* **Row Level Security (RLS) is the real security boundary.** The publishable key is public by design; anything the browser can do, anyone can do. Every table and storage bucket must have RLS policies that match intent (e.g. public `select` on active `productos`; `insert/update/delete` only for authenticated admins; `pedidos_log` insert-only for anon). Use the `postgres-best-practices` skill for policy design.
* **Only add a server endpoint when the browser cannot be trusted** with the operation: it needs a secret key (Supabase secret/service_role, payment provider, WhatsApp Business API), it must enforce business rules the client could bypass (price recalculation, order totals), or it calls a third-party API with private credentials.
* Before creating an endpoint, confirm how it will be deployed — Vercel currently serves only `frontend/` statically. A new endpoint may need a Vercel Function (`api/` folder) or a separate host. Ask the user if unclear.

---

## 2. Risk check before coding

Quickly rate (low / medium / high) and state it in your plan:

| Question | High risk when… |
| --- | --- |
| Does it touch auth or admin actions? | Changes who can edit products or read orders |
| Does it touch money? | Prices, totals, order data sent to WhatsApp |
| Does it touch secrets? | New keys, env vars, service_role usage |
| Can it be tested locally? | Only verifiable in production |

Any **high** → explain the risk to the user and propose how to verify before implementing.

---

## 3. Secrets & configuration (non-negotiable)

* Secrets live **only** in `backend/.env` (loaded with `dotenv`) or in the hosting provider's env settings. Never in `frontend/`, never committed.
* The Supabase **secret / service_role key must never reach the browser.** Only the publishable key may appear in `frontend/js/supabaseClient.js`.
* Read env vars in **one place** once the server grows (`backend/src/config.js`), fail fast if a required one is missing:

```js
// backend/src/config.js
const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Falta la variable de entorno ${key}`);
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  supabase: { url: process.env.SUPABASE_URL, secretKey: process.env.SUPABASE_SECRET_KEY },
};
```

* Keep a `backend/.env.example` with the variable names (no values) whenever you add one.
* `.env` and `node_modules/` must be in `.gitignore`.

---

## 4. Structure — grow it only when needed

Today everything fits in `backend/server.js`. Keep it that way while it is only static serving + a couple of routes. When you add real API logic (≈ more than 2 endpoints or ~150 lines), split into:

```
backend/
├── server.js            # bootstrap only: import app, listen
├── .env.example
└── src/
    ├── app.js           # express(), middleware, mount routers, error handler
    ├── config.js        # single env/config source
    ├── routes/          # pedidosRoutes.js — HTTP wiring only
    ├── services/        # pedidosService.js — business rules, framework-agnostic
    ├── lib/             # supabaseAdmin.js (server-side client with secret key)
    └── middleware/      # requireAdmin.js, validate.js, errorHandler.js
```

Rules:

* **Routes only route** — parse input, call a service, send the response. No Supabase queries inside route files.
* **Services decide** — business rules (e.g. recompute an order total from DB prices) live here and are testable without Express.
* ESM everywhere (`"type": "module"`), include the `.js` extension in relative imports.
* Naming: `camelCaseRoutes.js`, `camelCaseService.js`, kebab or camel for folders — stay consistent with what exists.

---

## 5. Validation

Validate **all** external input at the boundary (body, params, query, webhooks). For a couple of simple fields, hand-written checks are fine; once there are several endpoints, add `zod` and validate with a schema:

```js
import { z } from 'zod';

const pedidoSchema = z.object({
  items: z.array(z.object({ id: z.number().int().positive(), cantidad: z.number().int().min(1).max(50) })).min(1),
  nombre: z.string().trim().min(2).max(80),
  telefono: z.string().regex(/^\d{10}$/),
});

const input = pedidoSchema.parse(req.body); // throws → handled by error middleware
```

Never trust prices, totals or roles sent by the client — look them up server-side.

---

## 6. Errors & async

Express 4 does **not** catch rejected promises. Wrap async handlers and use one central error middleware:

```js
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// last middleware in app.js
app.use((err, req, res, next) => {
  const status = err.name === 'ZodError' ? 400 : err.status || 500;
  if (status >= 500) console.error('[error]', req.method, req.originalUrl, err);
  res.status(status).json({ error: status >= 500 ? 'Error interno del servidor' : err.message });
});
```

* Never leak stack traces or Supabase error details to the client.
* Always check `{ error }` from supabase-js calls — it does not throw.
* `console.error` with context is acceptable logging at this scale; add an error tracker (e.g. Sentry) only if the user wants it.

---

## 7. Security checklist

* [ ] RLS enabled and correct on every table/bucket touched
* [ ] No secret keys in `frontend/` or in git
* [ ] Admin-only endpoints verify the Supabase JWT (`supabaseAdmin.auth.getUser(token)`) and the admin role — never trust a flag from the client
* [ ] `cors()` restricted to the real origins before exposing a public API (today it is open)
* [ ] Input validated; prices/totals recomputed server-side
* [ ] Files served statically cannot expose anything outside `frontend/`

---

## 8. Testing

* Use Node's built-in runner (`node --test`) for services — no extra dependency needed.
* For endpoints, test with `supertest` against `app.js` (export `app` separately from `listen`).
* At minimum, manually verify the flow in the browser (`npm run dev` in `backend/`) and report what was checked.

---

## 9. Anti-patterns

❌ Supabase secret key anywhere in `frontend/`
❌ Relying on hiding buttons in the UI instead of RLS
❌ Business logic or queries inside route handlers once `src/` exists
❌ Unwrapped async handlers / ignoring supabase-js `{ error }`
❌ Trusting client-sent prices, totals or roles
❌ Adding microservices, TypeScript, Prisma or an ORM without the user asking — Supabase is the data layer

---

## 10. Related skills

* **postgres-best-practices** → schema, indexes, RLS policies
* **nodejs-best-practices** → general Node.js decisions (async, security, testing)
* **systematic-debugging** → any bug in server or Supabase calls

## Limitations
- Stop and ask for clarification if required inputs, permissions, deployment target or success criteria are missing.
- Do not treat the output as a substitute for testing against the real Supabase project.
