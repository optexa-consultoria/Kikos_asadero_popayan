/**
 * Lógica del Panel de Administración (B2B) - SPA & Tailwind
 */

window.checkAdminSession = async function() {
    const { data: { session }, error } = await supabase.auth.getSession();
    const loginView = document.getElementById('view-admin-login');
    const dashboardView = document.getElementById('view-admin-dashboard');
    
    if (error || !session) {
        if(dashboardView) dashboardView.classList.remove('active');
        if(loginView) loginView.classList.add('active');
        return;
    }
    
    // UI del Admin
    if(loginView) loginView.classList.remove('active');
    if(dashboardView) dashboardView.classList.add('active');
    loadAdminProducts();
};

// Listen para cambios de Auth globales
supabase.auth.onAuthStateChange((event, session) => {
    window.checkAdminSession();
});

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

            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });

                if (error) {
                    throw error;
                }
                
                // Si llegamos aquí, fue exitoso
                loginForm.reset();
                loginBtn.disabled = false;
                loginBtn.textContent = 'Entrar al Sistema';
                window.checkAdminSession();

            } catch (err) {
                console.error("Error en login:", err);
                
                // Manejar error de email no confirmado específicamente (muy común)
                if (err.message.includes('Email not confirmed')) {
                    loginError.textContent = 'Error: Falta confirmar el correo. Por favor revisa la bandeja de entrada o desactiva "Confirm email" en Supabase.';
                } else {
                    loginError.textContent = err.message || 'Credenciales incorrectas o error de conexión.';
                }
                
                loginError.classList.remove('hidden');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Entrar al Sistema';
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
            window.checkAdminSession();
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
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-dark font-display text-2xl uppercase border-b-4 border-dark">No hay inventario registrado.</td></tr>';
            return;
        }

        let html = '';
        window.adminProducts = data; // Cache para edición rápida

        data.forEach(p => {
            const imgSrc = p.URL_Imagen || 'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#09090b\\\'/></svg>';
            
            const badgeActivo = p.Activo 
                ? '<span class="bg-primary text-white px-2 py-1 font-display uppercase tracking-widest text-xs border-2 border-dark shadow-brutal-sm">Operativo</span>' 
                : '<span class="bg-white text-dark px-2 py-1 font-display uppercase tracking-widest text-xs border-2 border-dark shadow-brutal-sm">Baja</span>';
            
            const badgeDestacado = p.Destacado 
                ? '<span class="bg-secondary text-dark px-2 py-1 font-display uppercase tracking-widest text-xs border-2 border-dark shadow-brutal-sm mt-2 inline-block">Élite</span>' 
                : '';

            html += `
                <tr class="hover:bg-surface transition-colors border-b-4 border-dark">
                    <td class="p-4 border-r-4 border-dark">
                        <img src="${imgSrc}" class="w-16 h-16 object-cover border-4 border-dark grayscale bg-dark" alt="img">
                    </td>
                    <td class="p-4 border-r-4 border-dark">
                        <p class="font-display font-bold text-xl text-dark uppercase leading-none">${p.Nombre}</p>
                    </td>
                    <td class="p-4 border-r-4 border-dark text-dark font-bold font-display uppercase">${p.Categoria}</td>
                    <td class="p-4 border-r-4 border-dark font-display font-bold text-xl text-primary">$${p.Precio.toFixed(2)}</td>
                    <td class="p-4 border-r-4 border-dark">
                        <div class="flex flex-col items-start">${badgeActivo}${badgeDestacado}</div>
                    </td>
                    <td class="p-4 text-center">
                        <div class="flex flex-col gap-2 justify-center items-center">
                            <button class="bg-white text-dark border-4 border-dark font-display uppercase font-bold px-4 py-1 hover:bg-dark hover:text-white transition-colors w-full" onclick="window.editProduct('${p.ID}')">Reconfigurar</button>
                            <button class="bg-primary text-white border-4 border-dark font-display uppercase font-bold px-4 py-1 hover:bg-dark hover:text-white transition-colors w-full" onclick="window.deleteProduct('${p.ID}')">Purgar</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error fetching admin products:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-primary font-display text-2xl uppercase border-b-4 border-dark">Falla de Sistema.</td></tr>`;
    }
}

window.editProduct = function(id) {
    const product = window.adminProducts.find(p => p.ID.toString() === id.toString());
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
