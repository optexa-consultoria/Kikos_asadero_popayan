/**
 * Lógica principal del sitio público: destacados, menú y filtros por categoría.
 */

// Orden preferido de las categorías en el menú (las demás van al final)
const ORDEN_CATEGORIAS = ['Pollos', 'Combos', 'Carnes', 'Adicionales', 'Bebidas', 'Postres'];

// Productos cargados, por ID, para que el botón "Agregar" no dependa de datos en el HTML
const productosPorId = new Map();

document.addEventListener('DOMContentLoaded', () => {
    const anio = document.getElementById('anio-actual');
    if (anio) anio.textContent = new Date().getFullYear();

    // Delegación de eventos: un solo listener para todos los botones "Agregar"
    document.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-agregar]');
        if (!boton) return;
        const producto = productosPorId.get(boton.dataset.agregar);
        if (producto) {
            window.appCart.addItem({
                id: producto.ID,
                name: producto.Nombre,
                price: producto.Precio,
                image: producto.URL_Imagen,
            });
        }
    });

    iniciarMapa();
    loadDestacados();
    loadMenu();
});

// El mapa de Google solo se carga cuando la persona lo pide (Google recibe su IP y puede usar cookies)
function iniciarMapa() {
    const boton = document.getElementById('cargar-mapa');
    const contenedor = document.getElementById('mapa');
    if (!boton || !contenedor) return;

    boton.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.title = 'Mapa de Google: Asadero Kikos, Calle 7a #2A-30, Popayán';
        iframe.src = 'https://www.google.com/maps?q=Asadero+Kikos,+Calle+7a+%232A-30,+Popay%C3%A1n,+Cauca&z=17&output=embed';
        iframe.className = 'w-full h-full border-0';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        contenedor.replaceChildren(iframe);
        iframe.focus();
    });
}

function registrarProductos(productos) {
    productos.forEach((p) => productosPorId.set(String(p.ID), p));
}

async function loadDestacados() {
    const grid = document.getElementById('destacados-grid');
    if (!grid) return;

    try {
        const { data: productos, error } = await supabaseApp
            .from('productos')
            .select('*')
            .eq('Activo', true)
            .eq('Destacado', true)
            .limit(6);

        if (error) throw error;
        registrarProductos(productos);
        renderProducts(productos, grid);
    } catch (err) {
        console.error('Error cargando destacados:', err);
        renderEstado(grid, 'error');
    } finally {
        grid.removeAttribute('aria-busy');
    }
}

async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('category-filters');
    if (!grid || !filtersContainer) return;

    try {
        const { data: productos, error } = await supabaseApp
            .from('productos')
            .select('*')
            .eq('Activo', true)
            .order('Categoria', { ascending: true })
            .order('Nombre', { ascending: true });

        if (error) throw error;
        registrarProductos(productos);

        const categorias = [...new Set(productos.map((p) => p.Categoria).filter(Boolean))].sort((a, b) => {
            const ia = ORDEN_CATEGORIAS.indexOf(a);
            const ib = ORDEN_CATEGORIAS.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b, 'es');
        });

        categorias.forEach((cat) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-btn shrink-0 h-11 px-5 rounded-full font-extrabold transition-colors cursor-pointer bg-white text-cafe shadow-calida hover:bg-arena';
            btn.dataset.filter = cat;
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = cat;
            filtersContainer.appendChild(btn);
        });

        filtersContainer.addEventListener('click', (e) => {
            const target = e.target.closest('.filter-btn');
            if (!target) return;

            filtersContainer.querySelectorAll('.filter-btn').forEach((b) => {
                const activo = b === target;
                b.setAttribute('aria-pressed', String(activo));
                b.classList.toggle('bg-rojo', activo);
                b.classList.toggle('text-white', activo);
                b.classList.toggle('bg-white', !activo);
                b.classList.toggle('text-cafe', !activo);
                b.classList.toggle('shadow-calida', !activo);
                b.classList.toggle('hover:bg-arena', !activo);
            });

            const category = target.dataset.filter;
            renderProducts(category === 'all' ? productos : productos.filter((p) => p.Categoria === category), grid);
        });

        renderProducts(productos, grid);
    } catch (err) {
        console.error('Error cargando el menú:', err);
        renderEstado(grid, 'error');
    } finally {
        grid.removeAttribute('aria-busy');
    }
}

function renderEstado(container, tipo) {
    const mensajes = {
        error: {
            titulo: 'No pudimos cargar el menú',
            texto: 'Intenta de nuevo en un momento o haz tu pedido directo por WhatsApp.',
        },
        vacio: {
            titulo: 'Aún no hay productos aquí',
            texto: 'Muy pronto tendremos novedades. Mientras tanto, escríbenos por WhatsApp.',
        },
    };
    const { titulo, texto } = mensajes[tipo];

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center text-center rounded-3xl bg-white shadow-calida px-6 py-12">
            <img src="/img/pollito-chef.png" alt="" class="w-24 h-auto" width="134" height="140">
            <p class="font-display uppercase text-3xl mt-4">${titulo}</p>
            <p class="text-cafe-suave mt-2 max-w-md">${texto}</p>
            <a href="${window.waLink('¡Hola Asadero Kikos! Quisiera hacer un pedido.')}" target="_blank" rel="noopener" class="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-whatsapp text-white font-extrabold hover:bg-whatsapp-oscuro transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><use href="#icono-whatsapp"/></svg>
                Pedir por WhatsApp
            </a>
        </div>`;
}

function renderProducts(productos, container) {
    if (!productos || productos.length === 0) {
        renderEstado(container, 'vacio');
        return;
    }

    container.innerHTML = productos.map((p) => {
        const id = escapeHtml(p.ID);
        const nombre = escapeHtml(p.Nombre);
        const descripcion = escapeHtml(p.Descripcion);

        const imagen = p.URL_Imagen
            ? `<img src="${escapeHtml(p.URL_Imagen)}" alt="${nombre}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-105">`
            : `<div class="w-full h-full bg-rotulo grid place-items-center"><img src="/img/pollito-chef.png" alt="" class="w-28 h-auto drop-shadow-xl" width="134" height="140"></div>`;

        return `
            <article class="group flex flex-col rounded-3xl bg-white shadow-calida hover:shadow-calida-lg transition-shadow overflow-hidden">
                <div class="relative aspect-[4/3] overflow-hidden bg-arena">
                    ${imagen}
                    ${p.Destacado ? '<span class="absolute top-4 left-4 rounded-full bg-amarillo text-cafe text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 shadow-calida">Recomendado</span>' : ''}
                </div>
                <div class="flex flex-col flex-1 p-6">
                    <h3 class="font-display uppercase text-2xl leading-tight">${nombre}</h3>
                    ${descripcion ? `<p class="mt-2 text-cafe-suave flex-1">${descripcion}</p>` : '<div class="flex-1"></div>'}
                    <div class="mt-5 flex items-center justify-between gap-3">
                        <span class="font-display text-3xl text-rojo">${formatCOP(p.Precio)}</span>
                        <button type="button" data-agregar="${id}" aria-label="Agregar ${nombre} al pedido" class="inline-flex items-center gap-2 h-11 pl-4 pr-5 rounded-full bg-rojo text-white font-extrabold hover:bg-rojo-oscuro transition-colors cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                            Agregar
                        </button>
                    </div>
                </div>
            </article>`;
    }).join('');
}
