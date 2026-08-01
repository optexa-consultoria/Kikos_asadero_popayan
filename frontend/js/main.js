/**
 * Lógica principal de B2C (Menú y Destacados) - Tailwind
 */

document.addEventListener('DOMContentLoaded', () => {
    // Ya no inicializamos mobile menu aquí porque usamos el Bottom Bar y el Router
    loadDestacados();
    loadMenu();
});

async function loadDestacados() {
    const grid = document.getElementById('destacados-grid');
    if (!grid) return;

    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .eq('Activo', true)
            .eq('Destacado', true)
            .limit(6);

        if (error) throw error;
        renderProducts(productos, grid);
    } catch (err) {
        console.error('Error fetching destacados:', err);
        grid.innerHTML = '<div class="col-span-full text-center text-red-500 font-medium p-8">No se pudieron cargar los productos destacados.</div>';
    }
}

async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('category-filters');
    
    if (!grid || !filtersContainer) return;
    
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .eq('Activo', true)
            .order('Categoria', { ascending: true });

        if (error) throw error;

        // Extraer categorías únicas
        const categorias = [...new Set(productos.map(p => p.Categoria))];
        
        // Renderizar botones de filtro
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn bg-white text-gray-600 border-2 border-gray-200 hover:border-primary hover:text-primary px-6 py-2 rounded-full font-bold transition';
            btn.dataset.filter = cat;
            btn.textContent = cat;
            filtersContainer.appendChild(btn);
        });

        // Configurar eventos de filtro
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Actualizar UI de botones
                filterBtns.forEach(b => {
                    b.classList.remove('bg-primary', 'text-white', 'border-primary');
                    b.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
                });
                
                const target = e.target;
                target.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
                target.classList.add('bg-primary', 'text-white', 'border-primary');
                
                // Filtrar datos
                const category = target.dataset.filter;
                if (category === 'all') {
                    renderProducts(productos, grid);
                } else {
                    const filtered = productos.filter(p => p.Categoria === category);
                    renderProducts(filtered, grid);
                }
            });
        });

        // Render inicial (todos)
        renderProducts(productos, grid);

    } catch (err) {
        console.error('Error fetching menu:', err);
        grid.innerHTML = '<div class="col-span-full text-center text-red-500 font-medium p-8">No se pudo cargar el menú.</div>';
    }
}

function renderProducts(productos, container) {
    if (!productos || productos.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 p-8 font-medium">No hay productos en esta categoría.</div>';
        return;
    }

    let html = '';
    productos.forEach(p => {
        const productData = JSON.stringify({
            id: p.ID,
            name: p.Nombre,
            price: p.Precio,
            image: p.URL_Imagen
        }).replace(/"/g, '&quot;');

        const imgSrc = p.URL_Imagen || 'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#e5e7eb\\\'/></svg>';

        // Tarjeta con micro-interacciones (hover:-translate-y-1 hover:shadow-lg)
        html += `
            <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div class="h-48 w-full bg-gray-100 overflow-hidden">
                    <img src="${imgSrc}" alt="${p.Nombre}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy">
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <h4 class="font-extrabold text-xl text-dark mb-2">${p.Nombre}</h4>
                    <p class="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">${p.Descripcion || ''}</p>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="font-bold text-xl text-primary">$${p.Precio.toFixed(2)}</span>
                        <button class="bg-secondary hover:bg-yellow-500 text-dark font-bold py-2 px-4 rounded-lg shadow-sm transition transform active:scale-95 flex items-center gap-2" onclick="window.appCart.addItem(${productData})">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Añadir
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
