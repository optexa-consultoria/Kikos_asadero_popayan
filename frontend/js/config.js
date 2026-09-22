/**
 * Datos del negocio y utilidades compartidas (sitio público, admin y páginas legales).
 * Cambia aquí el teléfono, la dirección, etc. y se actualiza en toda la página.
 */
window.KIKOS = {
    nombre: 'Asadero Kikos',
    whatsapp: '573234444033',          // Formato internacional sin "+" (57 = Colombia)
    telefonoVisible: '323 444 4033',
    direccion: 'Calle 7a #2A-30, barrio Santa Inés',
    ciudad: 'Popayán, Cauca',
    sede: 'Sede Centro',
    horario: 'Atención 24 horas',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Asadero+Kikos+Calle+7a+2A-30+Popay%C3%A1n',

    // ⚠️ DATOS LEGALES OBLIGATORIOS (Ley 1581 de 2012 y Ley 1480 de 2011).
    // Completa estos campos ANTES de publicar la página. Mientras estén vacíos,
    // las páginas legales muestran un aviso "[PENDIENTE: …]" resaltado.
    legal: {
        responsable: '',   // Nombre o razón social del titular del negocio (como aparece en el RUT)
        documento: '',     // NIT (ej: 900.123.456-7) o cédula si es persona natural sin NIT
        correo: '',        // Correo para peticiones, quejas, reclamos y datos personales
    },
};

const formateadorCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

/** 38000 → "$38.000" */
window.formatCOP = (valor) => formateadorCOP.format(Number(valor) || 0).replace(/\s/g, '');

/** Escapa texto antes de insertarlo con innerHTML */
window.escapeHtml = (texto) => String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Enlace de WhatsApp con mensaje opcional */
window.waLink = (mensaje = '') =>
    `https://wa.me/${window.KIKOS.whatsapp}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;

/**
 * Mantiene el foco del teclado dentro de un panel abierto (carrito, modal).
 * Devuelve una función para liberar el foco al cerrar.
 */
window.atraparFoco = (contenedor) => {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
    const alPresionar = (e) => {
        if (e.key !== 'Tab') return;
        const enfocables = [...contenedor.querySelectorAll(selector)].filter((el) => el.offsetParent !== null);
        if (enfocables.length === 0) return;
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
            e.preventDefault();
            primero.focus();
        }
    };
    contenedor.addEventListener('keydown', alPresionar);
    return () => contenedor.removeEventListener('keydown', alPresionar);
};

// Rellena enlaces y datos marcados en el HTML
document.addEventListener('DOMContentLoaded', () => {
    const { legal } = window.KIKOS;

    document.querySelectorAll('[data-wa]').forEach((el) => {
        el.href = window.waLink(el.dataset.wa || '¡Hola Asadero Kikos! Quisiera hacer un pedido.');
    });
    document.querySelectorAll('[data-maps]').forEach((el) => { el.href = window.KIKOS.mapsUrl; });

    // <span data-dato="responsable|documento|correo">[PENDIENTE: …]</span>
    document.querySelectorAll('[data-dato]').forEach((el) => {
        const valor = legal[el.dataset.dato];
        if (!valor) {
            el.classList.add('dato-pendiente');
            return;
        }
        if (el.dataset.dato === 'correo' && el.tagName === 'A') el.href = `mailto:${valor}`;
        el.textContent = valor;
    });

    if (!legal.responsable || !legal.documento || !legal.correo) {
        console.warn('[Kikos] Faltan datos legales en js/config.js (responsable, documento, correo). Complétalos antes de publicar.');
    }
});
