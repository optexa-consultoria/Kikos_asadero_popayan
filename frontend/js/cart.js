/**
 * Gestión del carrito de compras usando localStorage y Toasts
 */
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('kikos_cart')) || [];
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
        this.toastContainer = document.getElementById('toast-container');

        if (this.cartCloseBtn) {
            this.cartCloseBtn.addEventListener('click', () => this.toggleDrawer());
        }
        if (this.cartOverlay) {
            this.cartOverlay.addEventListener('click', () => this.toggleDrawer());
        }
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => this.checkout());
        }

        this.updateUI();
    }

    toggleDrawer() {
        if (!this.cartDrawer) return;
        
        const isClosed = this.cartDrawer.classList.contains('translate-x-full');
        
        if (isClosed) {
            // Abrir
            this.cartDrawer.classList.remove('translate-x-full');
            this.cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
            this.cartOverlay.classList.add('opacity-100');
        } else {
            // Cerrar
            this.cartDrawer.classList.add('translate-x-full');
            this.cartOverlay.classList.remove('opacity-100');
            this.cartOverlay.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    showToast(message) {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'bg-dark text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in transition-all duration-300';
        toast.innerHTML = `
            <div class="bg-green-500 rounded-full p-1 text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <p class="font-medium text-sm">${message}</p>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Eliminar después de 2.5s (2s visible + animación)
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image,
                quantity: 1
            });
        }
        this.saveAndRender();
        this.showToast(`¡${product.name} añadido al carrito!`);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveAndRender();
    }

    updateQuantity(productId, delta) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveAndRender();
            }
        }
    }

    saveAndRender() {
        localStorage.setItem('kikos_cart', JSON.stringify(this.items));
        this.updateUI();
    }

    updateUI() {
        // Update count badges
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        if (this.navCartCount) this.navCartCount.textContent = totalItems;
        if (this.mobileCartCount) {
            this.mobileCartCount.textContent = totalItems;
            if (totalItems > 0) {
                this.mobileCartCount.classList.remove('hidden');
                this.mobileCartCount.classList.add('flex');
            } else {
                this.mobileCartCount.classList.add('hidden');
                this.mobileCartCount.classList.remove('flex');
            }
        }

        if (!this.cartItemsContainer) return;

        // Render items
        if (this.items.length === 0) {
            this.cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10 font-medium">Tu carrito está vacío.</p>';
            this.cartTotalPrice.textContent = '$0.00';
            this.checkoutBtn.disabled = true;
            return;
        }

        this.checkoutBtn.disabled = false;
        let html = '';
        let total = 0;

        this.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            html += `
                <div class="flex gap-4 py-4 border-b border-gray-100 items-center">
                    <img src="${item.image || ''}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover bg-gray-100" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#f3f4f6\\\'/></svg>'">
                    <div class="flex-grow">
                        <div class="font-bold text-dark text-sm mb-1 leading-tight">${item.name}</div>
                        <div class="text-primary font-bold text-sm mb-2">$${item.price.toFixed(2)}</div>
                        <div class="flex items-center gap-3">
                            <button class="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition" onclick="window.appCart.updateQuantity('${item.id}', -1)">-</button>
                            <span class="font-bold text-sm">${item.quantity}</span>
                            <button class="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition" onclick="window.appCart.updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="text-gray-400 hover:text-primary transition p-2" onclick="window.appCart.removeItem('${item.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        });

        this.cartItemsContainer.innerHTML = html;
        this.cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    async checkout() {
        if (this.items.length === 0) return;

        const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // 1. Guardar log en Supabase
        const pedidoData = {
            Total_Venta: total,
            Detalle_JSON: this.items,
            Estado: 'Redirigido a WA'
        };

        try {
            await supabase.from('pedidos_log').insert([pedidoData]);
        } catch (error) {
            console.error("No se pudo registrar el log del pedido", error);
        }

        // 2. Generar mensaje de WhatsApp
        let message = `¡Hola Asadero Kikos! 🔥 Quisiera hacer el siguiente pedido:\n\n`;
        this.items.forEach(item => {
            message += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
        });
        message += `\n*Total estimado:* $${total.toFixed(2)}\n\n¿Me pueden confirmar el costo de envío y tiempo estimado?`;

        const encodedMessage = encodeURIComponent(message);
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        // 3. Limpiar carrito y redirigir
        this.items = [];
        this.saveAndRender();
        this.toggleDrawer();

        window.open(waUrl, '_blank');
    }
}

// Inicializar y hacer global
document.addEventListener('DOMContentLoaded', () => {
    window.appCart = new Cart();
});
