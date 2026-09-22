# Sistema de diseño — Asadero Kikos

> **Fuente de verdad del diseño.** Si existe `pages/<pagina>.md`, sus reglas tienen prioridad para esa página; si no, aplica este archivo.
> Implementación: tokens en `frontend/js/tailwind.config.js`, utilidades propias en `frontend/css/kikos.css`.

## Dirección: "Rótulo clásico" (claro)

La fachada del local llevada a la web, **siempre sobre fondos claros**.

- Degradado amarillo → naranja → rojo del aviso, logo real, círculo "24 horas", pollito chef, tono familiar.
- **Fondos:** crema, blanco y arena. **No usar fondos oscuros** (se descartaron las secciones carbón, el neón y el grano de la opción B).
- **No usar el borde de toldo ondulado** (medios círculos) en ninguna división: las secciones se separan por cambio de fondo (crema ↔ blanco) o por la franja del degradado.
- **Sello memorable:** el **sello circular "24 horas"** y la franja con el degradado del aviso.

## Colores

| Token | Hex | Uso |
| --- | --- | --- |
| `rojo` | `#E91C01` | CTA principal, precios, acentos (rojo del aviso). Blanco sobre rojo: 5,5:1 |
| `rojo-oscuro` | `#B81500` | Hover / pressed del rojo |
| `naranja` | `#FA6B02` | Degradado, borde de foco en formularios, detalles. **No** para texto sobre claro |
| `amarillo` | `#FED201` | Degradado, badges ("Favorito"), brillo de fondo. **No** para texto sobre claro |
| `crema` | `#FFF6E6` | Fondo claro principal |
| `arena` | `#F3E2C4` | Bordes y fondos sutiles sobre crema |
| `cafe` | `#2A1206` | Texto principal (tinta del logo) |
| `cafe-suave` | `#6B4A36` | Texto secundario sobre crema (7:1) |
| `whatsapp` | `#0E7A3F` | Botones de WhatsApp (blanco encima 5,3:1) |

Degradado del rótulo: `linear-gradient(180deg, #FED201 0%, #FA6B02 55%, #E91C01 100%)` → clases `.bg-rotulo` / `.bg-rotulo-x`.
Texto con degradado (`.texto-rotulo`): solo naranja → rojo, porque el amarillo no se lee sobre crema.
Portadas: `.brillo-calido` (crema con un brillo amarillo/naranja muy suave).

## Tipografía

- **Display:** `Anton` (títulos, precios, etiquetas en mayúsculas). Condensada como las letras del logo.
- **Texto:** `Nunito Sans` 400/600/800 (cuerpo, botones, formularios). El "Así es…" va en Nunito Sans 800 cursiva.
- Escala móvil → escritorio: H1 `text-5xl`→`text-8xl`, H2 `text-4xl`→`text-6xl`, cuerpo 16–18px, interlineado 1.5.

## Forma y profundidad

- Radios: tarjetas `rounded-3xl`, botones `rounded-full`, inputs `rounded-xl`.
- Sombras suaves y cálidas (`shadow-calida`), nada de sombras negras duras (eso era el estilo brutalista anterior).

## Imágenes

- Fotos **siempre a color**, cálidas y apetitosas. Nunca en escala de grises.
- Solo fotos propias o con licencia (registradas en `CREDITOS.md`). Las fotos de stock llevan la etiqueta visible "Imagen de referencia" y "(imagen de referencia)" en su texto alternativo.
- Todas las imágenes con `alt` descriptivo; las decorativas con `alt=""` y `aria-hidden="true"`.
- Logo: `img/logo-kikos.png` (fondos claros o degradado).
- Mascota: `img/pollito-chef.png` para estados vacíos, respaldo de productos sin foto y detalles.

## Voz y tono

Cercano, familiar, orgulloso del barrio. Frases cortas. "Así es Kikos". Tutear al cliente.
Evitar el tono agresivo anterior ("Fuego crudo", "Arsenal", "Exigir menú").

**Solo afirmaciones demostrables** (Ley 1480 de 2011, publicidad engañosa): usar hechos confirmados (dirección, atención 24 horas, domicilios por WhatsApp) y el lema del aviso ("Pollo, carne y mucho más…"). Nada de "el mejor", "el más pedido", "jugoso", "a la brasa", ni reseñas o testimonios que no sean reales y verificables. Los productos destacados se llaman "Recomendados".

Botones con verbo y objeto claros: "Ver el menú", "Agregar", "Enviar pedido por WhatsApp", "Cargar mapa de Google", "Guardar producto".

## Interacción y accesibilidad

- Transiciones de 150–300 ms en color/sombra; sin transformaciones que muevan el layout.
- `cursor-pointer` y foco visible (`outline` rojo). Nunca `focus:outline-none`.
- Texto pequeño en rojo: `text-rojo-oscuro` (6,2:1). El `rojo` de marca solo como fondo de botón (blanco encima 4,5:1) o en texto de 24px o más.
- Bordes de campos de formulario: `border-linea` (3,7:1). Paneles modales: `atraparFoco()` al abrir y `invisible` al cerrar.
- Áreas táctiles mínimas de 44px; mobile-first (375px) con barra inferior en móvil.
- Respetar `prefers-reduced-motion` (desactiva la marquesina y las animaciones).
- Íconos SVG en línea (estilo Heroicons), nunca emojis como íconos.
- Precios en COP con `Intl.NumberFormat('es-CO')` → `$38.000`.

## Datos del negocio

- Sede Centro: Calle 7a #2A-30, barrio Santa Inés, Popayán (Cauca).
- Atención 24 horas · Pedidos y domicilios por WhatsApp: 323 444 4033.
