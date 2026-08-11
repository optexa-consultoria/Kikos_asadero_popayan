/**
 * Router SPA Simple basado en Hash
 */

class Router {
    constructor() {
        this.routes = {
            '#/home': 'view-home',
            '#/menu': 'view-menu',
            '#/nosotros': 'view-nosotros'
        };
        this.defaultRoute = '#/home';
        
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Ejecutar en la primera carga
        if (!window.location.hash) {
            window.location.hash = this.defaultRoute;
        } else {
            this.handleRoute();
        }
    }

    handleRoute() {
        let hash = window.location.hash;
        
        // Redirigir a default si no existe
        if (!this.routes[hash]) {
            window.location.hash = this.defaultRoute;
            return; // el hashchange re-disparará esta función
        }

        const targetViewId = this.routes[hash];

        // Ocultar todas las vistas
        document.querySelectorAll('.spa-view').forEach(view => {
            view.classList.remove('active');
        });

        // Mostrar la vista activa
        const activeView = document.getElementById(targetViewId);
        if (activeView) {
            activeView.classList.add('active');
        }

        this.updateNavLinks(hash);
        window.scrollTo(0, 0);
    }

    updateNavLinks(hash) {
        // Desktop Navbar
        document.querySelectorAll('header nav a').forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('text-secondary');
            } else {
                link.classList.remove('text-secondary');
            }
        });

        // Mobile Bottom Nav
        document.querySelectorAll('.nav-link-mobile').forEach(link => {
            if (link.dataset.target === hash) {
                link.classList.add('text-primary');
                link.classList.remove('text-gray-500');
            } else {
                link.classList.remove('text-primary');
                link.classList.add('text-gray-500');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appRouter = new Router();
});
