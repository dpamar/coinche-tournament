// Simple hash-based router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const handler = this.routes[hash];

        if (handler) {
            this.currentRoute = hash;
            handler();
        } else {
            this.navigate('home');
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

const router = new Router();
