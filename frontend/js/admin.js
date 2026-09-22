/**
 * Panel de administración: inicio de sesión con Supabase Auth y CRUD de productos.
 * Importante: lo que puede hacer un usuario autenticado lo definen las políticas RLS en Supabase.
 */

const IMAGEN_VACIA = '/img/pollito-chef.png';
let productosAdmin = []; // Caché de la tabla para editar sin volver a consultar

// ---------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------
window.checkAdminSession = async function () {
    const { data: { session }, error } = await supabaseApp.auth.getSession();

    const loginView = document.getElementById('view-admin-login');
    const dashboardView = document.getElementById('view-admin-dashboard');
    const haySesion = !error && session;

    loginView?.classList.toggle('active', !haySesion);
    dashboardView?.classList.toggle('active', Boolean(haySesion));

    if (haySesion) loadAdminProducts();
};

// Reaccionar solo a entrar / salir (la revisión inicial se hace al cargar la página)
supabaseApp.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') window.checkAdminSession();
});

function mostrarToast(mensaje, tipo = 'ok') {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto rounded-full px-5 py-3 font-extrabold shadow-calida-lg transition-opacity duration-300 ${tipo === 'error' ? 'bg-rojo text-white' : 'bg-white text-cafe ring-1 ring-arena'}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2600);
}

document.addEventListener('DOMContentLoaded', () => {
    window.checkAdminSession();

    // -----------------------------------------------------------
    // 1. Inicio de sesión
    // -----------------------------------------------------------
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginBtn.disabled = true;
        loginBtn.textContent = 'Ingresando…';
        loginError.classList.add('hidden');

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const { error } = await supabaseApp.auth.signInWithPassword({ email, password });
            if (error) throw error;
            loginForm.reset(); // El evento SIGNED_IN muestra el panel
        } catch (err) {
            let mensaje = 'Correo o contraseña incorrectos.';
            if (err.message?.includes('Email not confirmed')) {
                mensaje = 'Falta confirmar el correo. Revisa tu bandeja de entrada o desactiva "Confirm email" en Supabase.';
            } else if (err.message?.toLowerCase().includes('fetch')) {
                mensaje = 'No hay conexión con el servidor. Intenta de nuevo en un momento.';
            }
            loginError.textContent = mensaje;
            loginError.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Ingresar';
        }
    });

    // -----------------------------------------------------------
    // 2. Cerrar sesión
    // -----------------------------------------------------------
    document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
        await supabaseApp.auth.signOut(); // El evento SIGNED_OUT vuelve al inicio de sesión
    });

    // -----------------------------------------------------------
    // 3. Modal de producto
    // -----------------------------------------------------------
    const form = document.getElementById('product-form');
    const precioInput = document.getElementById('prod-precio');
    const precioVista = document.getElementById('prod-precio-vista');

    document.getElementById('btn-add-product')?.addEventListener('click', () => abrirModal());
    document.querySelectorAll('.admin-modal-close').forEach((btn) => btn.addEventListener('click', cerrarModal));
    document.getElementById('admin-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'admin-modal-overlay') cerrarModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });

    precioInput?.addEventListener('input', () => {
        precioVista.textContent = precioInput.value ? `Se verá como ${formatCOP(precioInput.value)}` : '';
    });

    // Editar / eliminar desde la tabla (delegación de eventos)
    document.getElementById('admin-products-tbody')?.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        if (boton.dataset.accion === 'editar') editProduct(boton.dataset.id);
        if (boton.dataset.accion === 'eliminar') deleteProduct(boton.dataset.id);
    });

    // -----------------------------------------------------------
    // 4. Guardar (crear / editar)
    // -----------------------------------------------------------
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-product-btn');
        const uploadStatus = document.getElementById('upload-status');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando…';

        try {
            const id = document.getElementById('prod-id').value;
            let urlImagen = document.getElementById('prod-url-imagen-actual').value;
            const fileInput = document.getElementById('prod-imagen');

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop().toLowerCase();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

                uploadStatus.textContent = 'Subiendo foto…';
                const { error: uploadError } = await supabaseApp.storage
                    .from('productos-imagenes')
                    .upload(`public/${fileName}`, file);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabaseApp.storage
                    .from('productos-imagenes')
                    .getPublicUrl(`public/${fileName}`);
                urlImagen = publicUrl;
            }

            const productData = {
                Nombre: document.getElementById('prod-nombre').value.trim(),
                Descripcion: document.getElementById('prod-descripcion').value.trim(),
                Precio: Math.round(Number(precioInput.value)),
                Categoria: document.getElementById('prod-categoria').value,
                Activo: document.getElementById('prod-activo').checked,
                Destacado: document.getElementById('prod-destacado').checked,
                URL_Imagen: urlImagen || null,
            };

            const { error } = id
                ? await supabaseApp.from('productos').update(productData).eq('ID', id)
                : await supabaseApp.from('productos').insert([productData]);
            if (error) throw error;

            cerrarModal();
            mostrarToast(id ? 'Producto actualizado' : 'Producto creado');
            loadAdminProducts();
        } catch (error) {
            console.error('Error guardando producto:', error);
            uploadStatus.textContent = `No se pudo guardar: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar producto';
        }
    });
});

let focoAntesDelModal = null;
let liberarFocoModal = null;

function abrirModal(titulo = 'Nuevo producto') {
    focoAntesDelModal = document.activeElement;
    document.getElementById('modal-title').textContent = titulo;
    document.getElementById('admin-modal-overlay').classList.remove('opacity-0', 'pointer-events-none', 'invisible');
    const contenido = document.getElementById('admin-modal-content');
    contenido.classList.remove('scale-95');
    contenido.classList.add('scale-100');
    liberarFocoModal = window.atraparFoco(contenido);
    setTimeout(() => document.getElementById('prod-nombre').focus(), 50);
}

function cerrarModal() {
    const overlay = document.getElementById('admin-modal-overlay');
    if (overlay.classList.contains('opacity-0')) return;
    overlay.classList.add('opacity-0', 'pointer-events-none');
    const contenido = document.getElementById('admin-modal-content');
    contenido.classList.remove('scale-100');
    contenido.classList.add('scale-95');
    liberarFocoModal?.();
    focoAntesDelModal?.focus?.();

    setTimeout(() => {
        overlay.classList.add('invisible'); // Fuera del orden de tabulación mientras está cerrado
        document.getElementById('product-form').reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-url-imagen-actual').value = '';
        document.getElementById('upload-status').textContent = '';
        document.getElementById('prod-precio-vista').textContent = '';
    }, 300);
}

// ---------------------------------------------------------------
// Tabla de productos
// ---------------------------------------------------------------
async function loadAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    const resumen = document.getElementById('admin-resumen');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseApp
            .from('productos')
            .select('*')
            .order('Categoria', { ascending: true })
            .order('Nombre', { ascending: true });
        if (error) throw error;

        productosAdmin = data;
        const activos = data.filter((p) => p.Activo).length;
        resumen.textContent = `${data.length} productos · ${activos} visibles en el menú`;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-10 text-center text-cafe-suave">Todavía no hay productos. Crea el primero con "Nuevo producto".</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((p) => {
            const id = escapeHtml(p.ID);
            const nombre = escapeHtml(p.Nombre);
            const estado = p.Activo
                ? '<span class="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-800 text-xs font-extrabold px-3 py-1"><span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>Visible</span>'
                : '<span class="inline-flex items-center gap-1.5 rounded-full bg-arena text-cafe-suave text-xs font-extrabold px-3 py-1"><span class="w-1.5 h-1.5 rounded-full bg-cafe-suave"></span>Oculto</span>';
            const favorito = p.Destacado
                ? '<span class="inline-flex rounded-full bg-amarillo text-cafe text-xs font-extrabold px-3 py-1">Recomendado</span>'
                : '';

            return `
                <tr class="hover:bg-crema/60 transition-colors">
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-4">
                            <img src="${escapeHtml(p.URL_Imagen || IMAGEN_VACIA)}" alt="" class="w-14 h-14 rounded-xl object-cover bg-arena shrink-0">
                            <div class="min-w-0">
                                <p class="font-extrabold">${nombre}</p>
                                <p class="text-sm text-cafe-suave line-clamp-1 max-w-xs">${escapeHtml(p.Descripcion)}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-4 font-semibold">${escapeHtml(p.Categoria)}</td>
                    <td class="px-5 py-4 font-display text-xl text-rojo">${formatCOP(p.Precio)}</td>
                    <td class="px-5 py-4"><div class="flex flex-wrap gap-2">${estado}${favorito}</div></td>
                    <td class="px-5 py-4">
                        <div class="flex justify-end gap-2">
                            <button type="button" data-accion="editar" data-id="${id}" class="h-10 px-4 rounded-full border-2 border-arena font-extrabold hover:bg-arena transition-colors cursor-pointer">Editar</button>
                            <button type="button" data-accion="eliminar" data-id="${id}" class="h-10 px-4 rounded-full text-rojo-oscuro font-extrabold hover:bg-rojo/10 transition-colors cursor-pointer" aria-label="Eliminar ${nombre}">Eliminar</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    } catch (error) {
        console.error('Error cargando productos:', error);
        resumen.textContent = '';
        tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-10 text-center text-rojo-oscuro font-bold">No se pudieron cargar los productos. Revisa la conexión con Supabase.</td></tr>';
    }
}

function editProduct(id) {
    const product = productosAdmin.find((p) => String(p.ID) === String(id));
    if (!product) return;

    document.getElementById('prod-id').value = product.ID;
    document.getElementById('prod-nombre').value = product.Nombre;
    document.getElementById('prod-descripcion').value = product.Descripcion || '';
    document.getElementById('prod-precio').value = product.Precio;
    document.getElementById('prod-precio-vista').textContent = `Se verá como ${formatCOP(product.Precio)}`;

    // Si la categoría no está en la lista, se agrega para no perderla al guardar
    const select = document.getElementById('prod-categoria');
    if (product.Categoria && ![...select.options].some((o) => o.value === product.Categoria)) {
        select.add(new Option(product.Categoria, product.Categoria));
    }
    select.value = product.Categoria;

    document.getElementById('prod-activo').checked = product.Activo;
    document.getElementById('prod-destacado').checked = product.Destacado;
    document.getElementById('prod-url-imagen-actual').value = product.URL_Imagen || '';

    abrirModal('Editar producto');
}

async function deleteProduct(id) {
    const product = productosAdmin.find((p) => String(p.ID) === String(id));
    if (!confirm(`¿Eliminar "${product?.Nombre ?? 'este producto'}" del menú? Esta acción no se puede deshacer.`)) return;

    try {
        const { error } = await supabaseApp.from('productos').delete().eq('ID', id);
        if (error) throw error;
        mostrarToast('Producto eliminado');
        loadAdminProducts();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarToast('No se pudo eliminar el producto', 'error');
    }
}
