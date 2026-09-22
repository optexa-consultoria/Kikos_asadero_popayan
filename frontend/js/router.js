/**
 * Router SPA simple basado en hash.
 * Cada ruta muestra una vista (.spa-view) y opcionalmente hace scroll a una sección.
 */
class Router {
    constructor() {
        this.routes = {
            '#/home': { view: 'view-home' },
            '#/menu': { view: 'view-menu' },
            '#/nosotros': { view: 'view-nosotros' },
            '#/ubicacion': { view: 'view-home', section: 'ubicacion' },
        };
        this.defaultRoute = '#/home';

        window.addEventListener('hashchange', () => this.handleRoute());

        if (!window.location.hash) {
            window.location.hash = this.defaultRoute;
        } else {
            this.handleRoute();
        }
    }

    handleRoute() {
        const hash = window.location.hash;
        const route = this.routes[hash];

        // Ruta desconocida → inicio (el hashchange vuelve a llamar esta función)
        if (!route) {
            window.location.hash = this.defaultRoute;
            return;
        }

        document.querySelectorAll('.spa-view').forEach((view) => {
            view.classList.toggle('active', view.id === route.view);
        });

        this.updateNavLinks(hash);

        if (route.section) {
            document.getElementById(route.section)?.scrollIntoView();
        } else {
            window.scrollTo(0, 0);
        }
    }

    updateNavLinks(hash) {
        document.querySelectorAll('.nav-link, .nav-movil').forEach((link) => {
            const target = link.dataset.target || link.getAttribute('href');
            if (target === hash) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appRouter = new Router();
});
