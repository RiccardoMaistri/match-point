const API_BASE_URL = 'http://localhost:8001';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Network error' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        return this.request('/token', {
            method: 'POST',
            headers: {},
            body: formData
        });
    }

    async register(userData) {
        return this.request('/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getCurrentUser() {
        return this.request('/users/me');
    }

    // Tournament endpoints
    async getTournaments() {
        return this.request('/tournaments/');
    }

    async getTournament(id) {
        return this.request(`/tournaments/${id}`);
    }

    async createTournament(tournamentData) {
        return this.request('/tournaments/', {
            method: 'POST',
            body: JSON.stringify(tournamentData)
        });
    }

    async updateTournament(id, tournamentData) {
        return this.request(`/tournaments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(tournamentData)
        });
    }

    async deleteTournament(id) {
        return this.request(`/tournaments/${id}`, {
            method: 'DELETE'
        });
    }

    // Participant endpoints
    async addParticipant(tournamentId, participantData) {
        return this.request(`/tournaments/${tournamentId}/participants/`, {
            method: 'POST',
            body: JSON.stringify(participantData)
        });
    }

    async joinTournament(tournamentId) {
        return this.request(`/tournaments/${tournamentId}/join_authenticated`, {
            method: 'POST'
        });
    }

    // Match endpoints
    async getMatches(tournamentId) {
        return this.request(`/tournaments/${tournamentId}/matches`);
    }

    async generateMatches(tournamentId) {
        return this.request(`/tournaments/${tournamentId}/matches/generate`, {
            method: 'POST'
        });
    }

    async recordMatchResult(tournamentId, matchId, resultData) {
        return this.request(`/tournaments/${tournamentId}/matches/${matchId}/result`, {
            method: 'POST',
            body: JSON.stringify(resultData)
        });
    }
}

const api = new API();