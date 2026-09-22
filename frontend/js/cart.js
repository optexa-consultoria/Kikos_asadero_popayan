/**
 * Carrito de compras: se guarda en localStorage y el pedido se envía por WhatsApp.
 */
const CLAVE_CARRITO = 'kikos_cart';

function leerStorage(clave, porDefecto) {
    try {
        return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
    } catch {
        return porDefecto;
    }
}

function guardarStorage(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
        // Modo privado o almacenamiento bloqueado: el carrito sigue funcionando en memoria
    }
}

class Cart {
    constructor() {
        this.items = leerStorage(CLAVE_CARRITO, []);
        // Versiones anteriores guardaban nombre y dirección en el navegador: se borran (minimización de datos)
        try { localStorage.removeItem('kikos_cliente'); } catch { /* sin acceso al almacenamiento */ }
        this.initUI();
    }

    initUI() {
        this.navCartCount = document.getElementById('nav-cart-count');
        this.mobileCartCount = document.getElementById('mobile-cart-count');
        this.cartDrawer = document.getElementById('cart-drawer');
        this.cartOverlay = document.getElementById('cart-overlay');
        this.cartCloseBtn = document.getElementById('cart-close');
        this.cartItemsContainer = document.getElementById('cart-items-container');
        this.cartTotalPrice = document.getElementById('cart-total-price');
        this.checkoutBtn = document.getElementById('checkout-btn');
        this.checkoutForm = document.getElementById('checkout-form');
        this.checkoutError = document.getElementById('checkout-error');
        this.campoDireccion = document.getElementById('campo-direccion');
        this.toastContainer = document.getElementById('toast-container');

        document.querySelectorAll('[data-abrir-carrito]').forEach((boton) => {
            boton.addEventListener('click', () => this.toggleDrawer());
        });
        this.cartCloseBtn?.addEventListener('click', () => this.closeDrawer());
        this.cartOverlay?.addEventListener('click', () => this.closeDrawer());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.closeDrawer();
        });

        // Botones de cantidad / eliminar (delegación de eventos)
        this.cartItemsContainer?.addEventListener('click', (e) => {
            const boton = e.target.closest('[data-accion]');
            if (!boton) return;
            const id = boton.dataset.id;
            if (boton.dataset.accion === 'sumar') this.updateQuantity(id, 1);
            if (boton.dataset.accion === 'restar') this.updateQuantity(id, -1);
            if (boton.dataset.accion === 'eliminar') this.removeItem(id);
            if (boton.dataset.accion === 'ver-menu') this.closeDrawer();
        });

        if (this.checkoutForm) {
            this.checkoutForm.addEventListener('change', () => this.actualizarTipoEntrega());
            this.checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkout();
            });
            this.actualizarTipoEntrega();
        }

        this.updateUI();
    }

    // ---------------- Panel lateral ----------------

    isOpen() {
        return this.cartDrawer && !this.cartDrawer.classList.contains('translate-x-full');
    }

    toggleDrawer() {
        this.isOpen() ? this.closeDrawer() : this.openDrawer();
    }

    openDrawer() {
        if (!this.cartDrawer) return;
        this.ultimoFoco = document.activeElement;
        this.cartDrawer.classList.remove('translate-x-full', 'invisible');
        this.cartDrawer.setAttribute('aria-hidden', 'false');
        this.cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
        document.body.classList.add('overflow-hidden');
        this.liberarFoco = window.atraparFoco(this.cartDrawer);
        this.cartCloseBtn?.focus();
    }

    closeDrawer() {
        if (!this.cartDrawer) return;
        this.cartDrawer.classList.add('translate-x-full');
        this.cartDrawer.setAttribute('aria-hidden', 'true');
        this.cartOverlay.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('overflow-hidden');
        this.liberarFoco?.();
        // Ocultar del lector de pantalla y del tabulador cuando termina la animación
        setTimeout(() => { if (!this.isOpen()) this.cartDrawer.classList.add('invisible'); }, 300);
        this.ultimoFoco?.focus?.();
    }

    // ---------------- Notificaciones ----------------

    showToast(message) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-center gap-3 rounded-full bg-white text-cafe ring-1 ring-arena pl-2 pr-5 py-2 shadow-calida-lg transition-opacity duration-300';
        toast.innerHTML = `
            <span class="grid place-items-center w-8 h-8 rounded-full bg-rojo text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </span>
            <p class="font-extrabold">${escapeHtml(message)}</p>`;

        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2200);
    }

    // ---------------- Productos ----------------

    findItem(productId) {
        // Los IDs llegan como número (Supabase) o texto (atributos HTML): se comparan como texto
        return this.items.find((item) => String(item.id) === String(productId));
    }

    addItem(product) {
        const existingItem = this.findItem(product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                image: product.image,
                quantity: 1,
            });
        }
        this.saveAndRender();
        this.showToast(`${product.name} agregado a tu pedido`);
    }

    removeItem(productId) {
        this.items = this.items.filter((item) => String(item.id) !== String(productId));
        this.saveAndRender();
    }

    updateQuantity(productId, delta) {
        const item = this.findItem(productId);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeItem(productId);
        } else {
            this.saveAndRender();
        }
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    saveAndRender() {
        guardarStorage(CLAVE_CARRITO, this.items);
        this.updateUI();
    }

    updateUI() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        if (this.navCartCount) this.navCartCount.textContent = totalItems;
        if (this.mobileCartCount) {
            this.mobileCartCount.textContent = totalItems;
            this.mobileCartCount.classList.toggle('hidden', totalItems === 0);
            this.mobileCartCount.classList.toggle('flex', totalItems > 0);
        }

        if (!this.cartItemsContainer) return;

        if (this.items.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <li class="flex flex-col items-center text-center py-10">
                    <img src="/img/pollito-chef.png" alt="" class="w-24 h-auto" width="134" height="140">
                    <p class="font-display uppercase text-2xl mt-4">Tu pedido está vacío</p>
                    <p class="text-cafe-suave mt-1">Agrega algo rico del menú.</p>
                    <a href="#/menu" data-accion="ver-menu" class="mt-5 inline-flex items-center h-11 px-6 rounded-full bg-rojo text-white font-extrabold hover:bg-rojo-oscuro transition-colors">Ver el menú</a>
                </li>`;
            this.cartTotalPrice.textContent = formatCOP(0);
            this.checkoutBtn.disabled = true;
            this.checkoutForm?.classList.add('hidden');
            return;
        }

        this.checkoutBtn.disabled = false;
        this.checkoutForm?.classList.remove('hidden');

        this.cartItemsContainer.innerHTML = this.items.map((item) => {
            const id = escapeHtml(item.id);
            const nombre = escapeHtml(item.name);
            const imagen = item.image
                ? `<img src="${escapeHtml(item.image)}" alt="" class="w-20 h-20 rounded-2xl object-cover bg-arena shrink-0">`
                : `<div class="w-20 h-20 rounded-2xl bg-rotulo grid place-items-center shrink-0"><img src="/img/pollito-chef.png" alt="" class="w-12 h-auto"></div>`;

            return `
                <li class="flex gap-4 py-4 border-b border-arena">
                    ${imagen}
                    <div class="flex-1 min-w-0">
                        <p class="font-extrabold leading-tight">${nombre}</p>
                        <p class="text-sm text-cafe-suave">${formatCOP(item.price)} c/u</p>
                        <div class="mt-2 inline-flex items-center rounded-full border-2 border-arena bg-white">
                            <button type="button" data-accion="restar" data-id="${id}" class="grid place-items-center w-9 h-9 rounded-full hover:bg-arena transition-colors cursor-pointer" aria-label="Quitar uno de ${nombre}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" d="M5 12h14"/></svg>
                            </button>
                            <span class="w-8 text-center font-extrabold" aria-label="Cantidad">${item.quantity}</span>
                            <button type="button" data-accion="sumar" data-id="${id}" class="grid place-items-center w-9 h-9 rounded-full hover:bg-arena transition-colors cursor-pointer" aria-label="Agregar uno más de ${nombre}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-col items-end justify-between">
                        <span class="font-display text-xl text-rojo-oscuro">${formatCOP(item.price * item.quantity)}</span>
                        <button type="button" data-accion="eliminar" data-id="${id}" class="grid place-items-center w-9 h-9 rounded-full text-cafe-suave hover:text-rojo-oscuro hover:bg-arena transition-colors cursor-pointer" aria-label="Eliminar ${nombre} del pedido">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </li>`;
        }).join('');

        this.cartTotalPrice.textContent = formatCOP(this.getTotal());
    }

    // ---------------- Datos de entrega ----------------

    getCliente() {
        const form = this.checkoutForm;
        return {
            entrega: form.elements.entrega.value,
            nombre: form.elements.nombre.value.trim(),
            direccion: form.elements.direccion.value.trim(),
            notas: form.elements.notas.value.trim(),
            acepto: form.elements.acepto.checked,
        };
    }

    actualizarTipoEntrega() {
        const esDomicilio = this.checkoutForm.elements.entrega.value === 'domicilio';
        this.campoDireccion.classList.toggle('hidden', !esDomicilio);
        this.checkoutForm.elements.direccion.required = esDomicilio;
    }

    validarCliente(cliente) {
        if (cliente.entrega === 'domicilio' && !cliente.direccion) {
            return { campo: 'direccion', mensaje: 'Escribe la dirección de entrega.' };
        }
        if (!cliente.acepto) {
            return { campo: 'acepto', mensaje: 'Para enviar el pedido debes autorizar el uso de tus datos.' };
        }
        return null;
    }

    // ---------------- Enviar pedido ----------------

    checkout() {
        if (this.items.length === 0) return;

        const cliente = this.getCliente();
        const problema = this.validarCliente(cliente);
        if (problema) {
            this.checkoutError.textContent = problema.mensaje;
            this.checkoutError.classList.remove('hidden');
            const campo = this.checkoutForm.elements[problema.campo];
            campo.setAttribute('aria-invalid', 'true');
            campo.focus();
            return;
        }
        this.checkoutError.classList.add('hidden');
        this.checkoutForm.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));

        const total = this.getTotal();

        let message = '¡Hola Asadero Kikos! Quisiera hacer este pedido:\n\n';
        this.items.forEach((item) => {
            message += `• ${item.quantity} x ${item.name} — ${formatCOP(item.price * item.quantity)}\n`;
        });
        message += `\n*Total productos:* ${formatCOP(total)}\n`;
        if (cliente.nombre) message += `\n*A nombre de:* ${cliente.nombre}`;
        message += cliente.entrega === 'domicilio'
            ? `\n*Entrega:* Domicilio\n*Dirección:* ${cliente.direccion}`
            : '\n*Entrega:* Recojo en el local';
        if (cliente.notas) message += `\n*Notas:* ${cliente.notas}`;
        message += cliente.entrega === 'domicilio'
            ? '\n\n¿Me confirman el valor del domicilio y el tiempo de entrega?'
            : '\n\n¿Me confirman en cuánto tiempo está listo?';

        // Abrir WhatsApp de inmediato (dentro del clic) para que el navegador no lo bloquee
        window.open(window.waLink(message), '_blank', 'noopener');

        // Registro del pedido en segundo plano; si falla no afecta al cliente
        supabaseApp.from('pedidos_log')
            .insert([{
                Total_Venta: total,
                // Solo datos del producto (sin datos personales ni imágenes)
                Detalle_JSON: this.items.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
                Estado: 'Redirigido a WA',
            }])
            .then(({ error }) => { if (error) console.error('No se pudo registrar el pedido:', error); });

        this.items = [];
        this.checkoutForm.reset(); // No se conserva ningún dato personal tras enviar
        this.actualizarTipoEntrega();
        this.saveAndRender();
        this.closeDrawer();
        this.showToast('¡Pedido listo! Termina de enviarlo en WhatsApp');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appCart = new Cart();
});
