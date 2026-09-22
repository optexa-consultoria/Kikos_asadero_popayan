# Asadero Kikos — Página web

Sitio web de un asadero en Colombia: menú de productos, carrito y pedidos por WhatsApp, más un panel de administración para gestionar productos.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | HTML estático + Tailwind CSS (CDN) + JavaScript vanilla (scripts clásicos, variables globales) |
| Datos / Auth / Archivos | Supabase (`supabase-js@2` por CDN, llave **publishable** en el navegador) |
| Backend | Express 4 en ESM JavaScript (`backend/server.js`) — sirve `frontend/` en desarrollo local |
| Despliegue | Vercel sirve `frontend/` como sitio estático (`frontend/vercel.json`, `cleanUrls`) |

No hay React, Next.js, TypeScript ni paso de build.

## Estructura

```
frontend/
├── index.html          # Sitio público (SPA con hash router: #/home, #/menu, #/nosotros)
├── admin.html          # Panel admin (login Supabase + CRUD de productos)
└── js/
    ├── supabaseClient.js  # window.supabaseApp + WHATSAPP_NUMBER
    ├── router.js          # Router por hash
    ├── main.js            # Carga de productos
    ├── cart.js            # Carrito → registra en pedidos_log → abre wa.me
    └── admin.js           # CRUD productos + subida de imágenes
backend/server.js       # Express: estáticos + rutas de fallback
Resources/              # Fotos y material de marca
.claude/skills/         # Skills del proyecto (ver abajo)
```

## Supabase

- Tablas: `productos` (PK `ID`), `pedidos_log`.
- Storage: bucket `productos-imagenes`.
- La seguridad depende de **RLS**: la llave publishable es pública; nunca poner la secret/service_role en `frontend/`.

## Cómo correr

```bash
cd backend && npm install && npm run dev   # http://localhost:3000
```

## Identidad visual (neo-brutalista)

Definida en el `tailwind.config` inline de `index.html` y `admin.html` (mantener ambos sincronizados):

- Colores: `primary #FF2A00` (rojo fuego), `secondary #FFC800` (amarillo), `dark #09090b`, `surface #f4f4f0`.
- Tipografía: **Oswald** (títulos, `font-display`) + **Archivo** (texto, `font-sans`).
- Sombras duras desplazadas: `shadow-brutal`, `shadow-brutal-sm`, `shadow-brutal-hover`; bordes gruesos.
- Usar siempre los tokens de Tailwind (`bg-primary`), no hex sueltos. Extender el sistema, no reemplazarlo, salvo que se pida un rediseño.

## Convenciones

- Todo el texto visible al usuario y los comentarios de código en **español**.
- Mobile-first: la mayoría de clientes pide desde el celular.
- Precios en pesos colombianos (COP).

## Skills del proyecto (`.claude/skills/`)

Se activan solas según la tarea, o se llaman con `/nombre`.

| Tarea | Skill |
| --- | --- |
| Idea nueva o vaga, antes de construir | `/brainstorming` |
| Diseñar o rediseñar páginas, secciones, componentes | `/frontend-design` |
| Paletas, fuentes, estructura de landing, reglas UX | `/ui-ux-pro-max` |
| Auditar la interfaz ya hecha (accesibilidad, UX) | `/web-design-guidelines` |
| Backend Express, endpoints, secretos, dónde va la lógica | `/backend-dev-guidelines` |
| Decisiones generales de Node.js | `/nodejs-best-practices` |
| SQL, tablas, índices, políticas RLS de Supabase | `/postgres-best-practices` |
| Cualquier bug o error | `/systematic-debugging` |

Flujo recomendado para una funcionalidad visual: `brainstorming` → `ui-ux-pro-max` → `frontend-design` → `web-design-guidelines`.
