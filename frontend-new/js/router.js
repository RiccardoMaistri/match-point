class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        this.currentRoute = path;
        
        // Check for exact match first
        if (this.routes[path]) {
            this.routes[path]();
            return;
        }
        
        // Check for parameterized routes
        for (const route in this.routes) {
            const routeRegex = new RegExp('^' + route.replace(/:\w+/g, '([^/]+)') + '$');
            const match = path.match(routeRegex);
            
            if (match) {
                const params = this.extractParams(route, match);
                this.routes[route](params);
                return;
            }
        }
        
        // Default route
        if (this.routes['/']) {
            this.routes['/']();
        }
    }

    extractParams(route, match) {
        const paramNames = route.match(/:(\w+)/g) || [];
        const params = {};
        
        paramNames.forEach((param, index) => {
            const paramName = param.substring(1);
            params[paramName] = match[index + 1];
        });
        
        return params;
    }

    requireAuth(handler) {
        return (...args) => {
            if (!auth.isAuthenticated()) {
                this.navigate('/login');
                return;
            }
            handler(...args);
        };
    }

    init() {
        this.handleRoute();
    }
}

const router = new Router();