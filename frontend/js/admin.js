/**
 * Lógica del Panel de Administración (B2B) - SPA & Tailwind
 */

// Se llaman desde router.js cuando el hash cambia
window.checkAdminSession = async function() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.hash = '#/login';
        return;
    }
    
    // UI del Admin
    document.getElementById('admin-email-display').textContent = session.user.email;
    loadAdminProducts();
};

window.checkLoginSession = async function() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.hash = '#/admin';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------------------
    // 1. Lógica de Login
    // ----------------------------------------------------------------
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="animate-pulse">Iniciando...</span>';
            loginError.classList.add('hidden');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                loginError.textContent = error.message;
                loginError.classList.remove('hidden');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
            } else {
                loginForm.reset();
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
                window.location.hash = '#/admin';
            }
        });
    }

    // ----------------------------------------------------------------
    // 2. Logout
    // ----------------------------------------------------------------
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.hash = '#/login';
        });
    }

    // ----------------------------------------------------------------
    // 3. Modal CRUD Setup (Tailwind Classes)
    // ----------------------------------------------------------------
    const modalOverlay = document.getElementById('admin-modal-overlay');
    const modalContent = document.getElementById('admin-modal-content');
    const btnAdd = document.getElementById('btn-add-product');
    const form = document.getElementById('product-form');
    
    const closeBtns = document.querySelectorAll('.admin-modal-close');

    const toggleModal = () => {
        const isClosed = modalOverlay.classList.contains('opacity-0');
        if (isClosed) {
            // Abrir
            modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        } else {
            // Cerrar
            modalOverlay.classList.add('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            
            // Reset form
            setTimeout(() => {
                form.reset();
                document.getElementById('prod-id').value = '';
                document.getElementById('prod-url-imagen-actual').value = '';
                document.getElementById('upload-status').textContent = '';
                document.getElementById('modal-title').textContent = 'Añadir Producto';
            }, 300);
        }
    };

    if (btnAdd) btnAdd.addEventListener('click', toggleModal);
    closeBtns.forEach(btn => btn.addEventListener('click', toggleModal));

    // ----------------------------------------------------------------
    // 4. Submit Formulario (Crear/Editar)
    // ----------------------------------------------------------------
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-product-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            try {
                const id = document.getElementById('prod-id').value;
                const nombre = document.getElementById('prod-nombre').value;
                const desc = document.getElementById('prod-descripcion').value;
                const precio = parseFloat(document.getElementById('prod-precio').value);
                const categoria = document.getElementById('prod-categoria').value;
                const activo = document.getElementById('prod-activo').checked;
                const destacado = document.getElementById('prod-destacado').checked;
                
                let urlImagen = document.getElementById('prod-url-imagen-actual').value;
                const fileInput = document.getElementById('prod-imagen');

                // Si hay un archivo nuevo, subirlo a Supabase Storage
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    
                    document.getElementById('upload-status').textContent = 'Subiendo imagen...';
                    
                    const { error: uploadError } = await supabase.storage
                        .from('productos-imagenes')
                        .upload(`public/${fileName}`, file);

                    if (uploadError) throw uploadError;

                    // Obtener URL pública
                    const { data: { publicUrl } } = supabase.storage
                        .from('productos-imagenes')
                        .getPublicUrl(`public/${fileName}`);
                    
                    urlImagen = publicUrl;
                }

                const productData = {
                    Nombre: nombre,
                    Descripcion: desc,
                    Precio: precio,
                    Categoria: categoria,
                    Activo: activo,
                    Destacado: destacado,
                    URL_Imagen: urlImagen
                };

                if (id) {
                    // Update
                    const { error } = await supabase.from('productos').update(productData).eq('ID', id);
                    if (error) throw error;
                } else {
                    // Insert
                    const { error } = await supabase.from('productos').insert([productData]);
                    if (error) throw error;
                }

                toggleModal();
                loadAdminProducts();

            } catch (error) {
                console.error('Error guardando producto:', error);
                alert('Error al guardar: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar';
            }
        });
    }
});

async function loadAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('Categoria', { ascending: true });

        if (error) throw error;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">No hay productos registrados.</td></tr>';
            return;
        }

        let html = '';
        window.adminProducts = data; // Cache para edición rápida

        data.forEach(p => {
            const imgSrc = p.URL_Imagen || 'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#e5e7eb\\\'/></svg>';
            
            const badgeActivo = p.Activo 
                ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Activo</span>' 
                : '<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Inactivo</span>';
            
            const badgeDestacado = p.Destacado 
                ? '<span class="bg-yellow-100 text-amber-800 px-2 py-1 rounded text-xs font-bold mt-1 inline-block">★ Destacado</span>' 
                : '';

            html += `
                <tr class="hover:bg-gray-50 transition">
                    <td class="p-4">
                        <img src="${imgSrc}" class="w-12 h-12 object-cover rounded shadow-sm bg-gray-100" alt="img">
                    </td>
                    <td class="p-4">
                        <p class="font-bold text-gray-800">${p.Nombre}</p>
                    </td>
                    <td class="p-4 text-gray-600">${p.Categoria}</td>
                    <td class="p-4 font-bold text-gray-800">$${p.Precio.toFixed(2)}</td>
                    <td class="p-4">
                        <div>${badgeActivo}</div>
                        <div>${badgeDestacado}</div>
                    </td>
                    <td class="p-4">
                        <div class="flex gap-3">
                            <button class="text-blue-600 hover:text-blue-800 font-medium transition" onclick="window.editProduct('${p.ID}')">Editar</button>
                            <button class="text-red-600 hover:text-red-800 font-medium transition" onclick="window.deleteProduct('${p.ID}')">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error fetching admin products:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500">Error al cargar datos.</td></tr>`;
    }
}

window.editProduct = function(id) {
    const product = window.adminProducts.find(p => p.ID === id);
    if (!product) return;

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('prod-id').value = product.ID;
    document.getElementById('prod-nombre').value = product.Nombre;
    document.getElementById('prod-descripcion').value = product.Descripcion;
    document.getElementById('prod-precio').value = product.Precio;
    document.getElementById('prod-categoria').value = product.Categoria;
    document.getElementById('prod-activo').checked = product.Activo;
    document.getElementById('prod-destacado').checked = product.Destacado;
    document.getElementById('prod-url-imagen-actual').value = product.URL_Imagen || '';
    
    // Mostrar modal (reusando lógica de toggleModal indirectamente abriendo)
    const modalOverlay = document.getElementById('admin-modal-overlay');
    const modalContent = document.getElementById('admin-modal-content');
    modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
};

window.deleteProduct = async function(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto permanentemente?')) return;
    
    try {
        const { error } = await supabase.from('productos').delete().eq('ID', id);
        if (error) throw error;
        loadAdminProducts();
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('No se pudo eliminar el producto.');
    }
};
