class Auth {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('token');
    }

    async login(email, password) {
        try {
            const response = await api.login(email, password);
            this.token = response.access_token;
            localStorage.setItem('token', this.token);
            await this.loadCurrentUser();
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            await api.register(userData);
            return await this.login(userData.email, userData.password);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async loadCurrentUser() {
        if (!this.token) return null;
        
        try {
            this.currentUser = await api.getCurrentUser();
            return this.currentUser;
        } catch (error) {
            console.error('Failed to load user:', error);
            this.logout();
            return null;
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        router.navigate('/login');
    }

    isAuthenticated() {
        return !!this.token;
    }

    async init() {
        if (this.token) {
            await this.loadCurrentUser();
        }
    }
}

const auth = new Auth();