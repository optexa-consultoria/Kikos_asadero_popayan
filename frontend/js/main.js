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
        const { data: productos, error } = await supabaseApp
            .from('productos')
            .select('*')
            .eq('Activo', true)
            .eq('Destacado', true)
            .limit(6);

        if (error) throw error;
        renderProducts(productos, grid);
    } catch (err) {
        console.error('Error fetching destacados:', err);
        grid.innerHTML = '<div class="col-span-full text-center text-primary font-display text-3xl uppercase p-8 border-4 border-dark shadow-brutal">La conexión fue interceptada.</div>';
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
            .order('Categoria', { ascending: true });

        if (error) throw error;

        // Extraer categorías únicas
        const categorias = [...new Set(productos.map(p => p.Categoria))];
        
        // Renderizar botones de filtro
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn bg-white text-dark border-4 border-dark px-8 py-3 font-display text-2xl shadow-brutal-sm hover:shadow-none hover:translate-y-1 transition-all uppercase';
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
                    b.classList.remove('bg-primary', 'text-white');
                    b.classList.add('bg-white', 'text-dark');
                });
                
                const target = e.target;
                target.classList.remove('bg-white', 'text-dark');
                target.classList.add('bg-primary', 'text-white');
                
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
        grid.innerHTML = '<div class="col-span-full text-center text-primary font-display text-3xl uppercase p-8 border-4 border-dark shadow-brutal">La conexión fue interceptada.</div>';
    }
}

function renderProducts(productos, container) {
    if (!productos || productos.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-dark p-12 font-display text-3xl border-4 border-dark uppercase shadow-brutal-sm">Sector Vacío. No hay carne aquí.</div>';
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

        const imgSrc = p.URL_Imagen || 'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#09090b\\\'/></svg>';

        // Tarjeta Brutalista
        html += `
            <div class="bg-white border-4 border-dark flex flex-col transition-all shadow-brutal-sm hover:shadow-brutal hover:-translate-y-2">
                <div class="h-64 w-full bg-dark border-b-4 border-dark overflow-hidden relative">
                    <img src="${imgSrc}" alt="${p.Nombre}" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" loading="lazy">
                    ${p.Destacado ? '<div class="absolute top-4 right-4 bg-secondary text-dark font-display text-xl px-3 py-1 border-2 border-dark shadow-brutal-sm transform rotate-3">ÉLITE</div>' : ''}
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <h4 class="font-display text-3xl font-extrabold text-dark mb-4 uppercase leading-none">${p.Nombre}</h4>
                    <p class="text-lg text-gray-800 mb-6 flex-grow font-medium leading-snug">${p.Descripcion || ''}</p>
                    <div class="flex justify-between items-end mt-auto pt-4 border-t-4 border-dark">
                        <span class="font-display text-4xl font-bold text-primary block line-clamp-1">$${p.Precio.toFixed(2)}</span>
                        <button class="bg-dark hover:bg-primary text-white font-display text-xl py-3 px-6 shadow-brutal-sm hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase flex items-center gap-2" onclick="window.appCart.addItem(${productData})">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
