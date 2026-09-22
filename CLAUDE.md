# Asadero Kikos — Página web

Sitio web de un asadero de pollos en Popayán (Colombia), sede Centro — Calle 7a #2A-30, barrio Santa Inés; abierto 24 horas; pedidos por WhatsApp 323 444 4033. Incluye menú de productos, carrito y pedidos por WhatsApp, más un panel de administración para gestionar productos.

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
├── index.html             # Sitio público (SPA con hash router: #/home, #/menu, #/nosotros, #/ubicacion)
├── admin.html             # Panel admin (login Supabase + CRUD de productos)
├── privacidad.html        # Política de tratamiento de datos (Ley 1581 de 2012)
├── terminos.html          # Términos y condiciones (Ley 1480 de 2011)
├── cookies.html           # Política de cookies / almacenamiento local
├── reembolsos.html        # Cambios, garantías y reembolsos
├── css/kikos.css          # Utilidades de marca + estilos de páginas legales
├── css/fuentes.css        # @font-face de las fuentes auto-alojadas
├── fonts/                 # Anton y Nunito Sans (woff2) + licencias OFL
├── img/                   # Logo, pollito, aviso; img/referencia/ = fotos Unsplash marcadas "de referencia"
└── js/
    ├── vendor/            # Tailwind 3.4.17 y supabase-js 2.117.0 (copias locales, versión fija)
    ├── tailwind.config.js # Tokens de diseño (fuente única)
    ├── config.js          # Datos del negocio + DATOS LEGALES + formatCOP, escapeHtml, waLink, atraparFoco
    ├── supabaseClient.js  # window.supabaseApp
    ├── router.js          # Router por hash (marca aria-current en la navegación)
    ├── main.js            # Recomendados, menú, filtros y mapa bajo pedido
    ├── cart.js            # Carrito + autorización de datos → registra en pedidos_log → abre wa.me
    └── admin.js           # Sesión + CRUD productos + subida de imágenes
backend/server.js          # Express: estáticos, redirecciones y encabezados de seguridad
supabase/migrations/       # SQL aplicado en producción (RLS y administradores)
design-system/asadero-kikos/MASTER.md  # Guía de diseño
CREDITOS.md                # Derechos de imágenes, fuentes y librerías
Resources/                 # Material original del negocio (no se publica)
.claude/skills/            # Skills del proyecto (ver abajo)
```

Orden de scripts: supabase-js (vendor) → `config.js` → `supabaseClient.js` → resto. Los datos del negocio y legales se cambian solo en `config.js`; en el HTML se rellenan con `data-dato="responsable|documento|correo"`, `data-wa` y `data-maps`.

## Reglas legales y de privacidad (Colombia) — no romperlas

- **Sin terceros por defecto:** nada de CDN, Google Fonts, analítica, píxeles ni imágenes enlazadas de otros sitios; todo se sirve desde `frontend/`. El mapa de Google solo se carga al presionar "Cargar mapa" (por eso no hace falta banner de cookies). Si algún día se agrega analítica: primero consentimiento, y actualizar `cookies.html` y `privacidad.html`.
- **Datos mínimos:** el carrito pide solo dirección (si es domicilio), nombre opcional y notas opcionales, con **casilla de autorización obligatoria** (Ley 1581). Esos datos NO se guardan: van en el mensaje de WhatsApp. `pedidos_log` solo guarda id, nombre, precio y cantidad de productos.
- **Sin afirmaciones no demostrables:** nada de "el mejor", "lo que más se pide", "jugoso", "a la brasa", reseñas ni testimonios inventados. Solo hechos confirmados: dirección, 24 horas, domicilios por WhatsApp y el lema del aviso ("Así es Kikos", "Pollo, carne y mucho más").
- **Fotos:** solo propias o con licencia (registrar en `CREDITOS.md`); las de stock se marcan "imagen de referencia".
- **Precios:** en COP con impuestos incluidos (Ley 1480, art. 26).
- **Accesibilidad (WCAG 2.1 AA):** texto pequeño en rojo = `text-rojo-oscuro` (el `rojo` de marca solo como fondo de botón o texto ≥ 24px); bordes de campos `border-linea`; prohibido `focus:outline-none`; paneles modales con `atraparFoco()` e `invisible` al cerrarse; nada de `onclick` en línea (la CSP lo bloquea).
- **Seguridad:** la CSP y demás encabezados están en `frontend/vercel.json` y `backend/server.js` (mantenerlos iguales). Cualquier cambio de permisos en Supabase → nueva migración en `supabase/migrations/`.

## Supabase

- Tablas: `productos` (PK `ID`), `pedidos_log` (sin datos personales), `administradores` (quién puede editar).
- Storage: bucket público `productos-imagenes` (solo administradores suben o borran).
- **RLS activado** (`supabase/migrations/20260922_seguridad_rls.sql`): el público ve productos activos y registra pedidos; solo los usuarios de `administradores` (verificado con `privado.es_admin()`) editan productos, leen pedidos y gestionan imágenes.
- La llave publishable es pública; nunca poner la secret/service_role en `frontend/`.

## Cómo correr

```bash
cd backend && npm install && npm run dev   # http://localhost:3000
```

## Identidad visual — "Rótulo clásico" (fondos claros)

Guía completa: [design-system/asadero-kikos/MASTER.md](design-system/asadero-kikos/MASTER.md). Tokens en `frontend/js/tailwind.config.js`.

- Basada en el aviso real del local: degradado **amarillo `#FED201` → naranja `#FA6B02` → rojo `#E91C01`** (`.bg-rotulo`, `.bg-rotulo-x`).
- Colores: `rojo`, `rojo-oscuro`, `naranja`, `amarillo`, `crema` (fondo), `arena` (bordes), `cafe` / `cafe-suave` (texto), `whatsapp`.
- **Solo fondos claros** (crema / blanco / arena). Nada de secciones oscuras, neón ni el borde de toldo ondulado: el cliente los descartó.
- Tipografía: **Anton** (títulos, `font-display`) + **Nunito Sans** (texto, `font-sans`).
- Sellos de marca: círculo "24 horas", franja con el degradado, pollito chef, `.brillo-calido` en las portadas, `.texto-rotulo` (naranja → rojo).
- Formas redondeadas (`rounded-3xl`, botones `rounded-full`) y sombras cálidas (`shadow-calida`). Nada de fotos en gris.
- Tono cercano y familiar ("Así es Kikos…"). Usar siempre tokens de Tailwind, no hex sueltos.

## Convenciones

- Todo el texto visible al usuario y los comentarios de código en **español**.
- Mobile-first: la mayoría de clientes pide desde el celular.
- Precios en pesos colombianos con `formatCOP()` → `$38.000` (nunca `toFixed(2)`).
- Texto dinámico en `innerHTML` siempre pasa por `escapeHtml()`.

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
