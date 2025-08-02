class App {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // Public routes
        router.addRoute('/', () => this.renderHome());
        router.addRoute('/login', () => this.renderLogin());
        router.addRoute('/register', () => this.renderRegister());
        
        // Protected routes
        router.addRoute('/tournaments', router.requireAuth(() => this.renderTournaments()));
        router.addRoute('/tournament/:id', router.requireAuth((params) => this.renderTournamentDetail(params.id)));
        router.addRoute('/profile', router.requireAuth(() => this.renderProfile()));
        router.addRoute('/settings', router.requireAuth(() => this.renderSettings()));
    }

    async init() {
        await auth.init();
        router.init();
    }

    renderHome() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div>
                ${Components.header('Match Point', null, `
                    <div class="flex w-12 items-center justify-end">
                        <button class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0" onclick="router.navigate('/settings')">
                            ${Components.getIcon('Gear')}
                        </button>
                    </div>
                `)}
                
                <h2 class="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Quick Access</h2>
                
                <div class="flex items-center gap-4 bg-[#141a1f] px-4 min-h-14 cursor-pointer" onclick="router.navigate('/tournaments')">
                    <div class="text-white flex items-center justify-center rounded-lg bg-[#2b3640] shrink-0 size-10">
                        ${Components.getIcon('Trophy')}
                    </div>
                    <p class="text-white text-base font-normal leading-normal flex-1 truncate">My Tournaments</p>
                </div>
                
                <div class="flex items-center gap-4 bg-[#141a1f] px-4 min-h-14 cursor-pointer" onclick="router.navigate('/profile')">
                    <div class="text-white flex items-center justify-center rounded-lg bg-[#2b3640] shrink-0 size-10">
                        ${Components.getIcon('User')}
                    </div>
                    <p class="text-white text-base font-normal leading-normal flex-1 truncate">My Profile</p>
                </div>
            </div>
            
            <div>
                ${Components.bottomNavigation('home')}
            </div>
        `;
    }

    renderLogin() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div>
                ${Components.header('Login')}
                
                <form id="loginForm">
                    ${Components.inputField('Email', 'Enter your email', 'email', '', true)}
                    ${Components.inputField('Password', 'Enter your password', 'password', '', true)}
                </form>
            </div>
            
            <div>
                ${Components.button('Login', 'handleLogin()', true)}
                ${Components.button('Register', "router.navigate('/register')", false)}
                ${Components.bottomNavigation()}
            </div>
        `;

        window.handleLogin = async () => {
            const form = document.getElementById('loginForm');
            const formData = new FormData(form);
            const email = form.querySelector('input[type="email"]').value;
            const password = form.querySelector('input[type="password"]').value;

            try {
                await auth.login(email, password);
                router.navigate('/');
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        };
    }

    renderRegister() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div>
                ${Components.header('Register', Components.closeButton("router.navigate('/login')"))}
                
                <form id="registerForm">
                    ${Components.inputField('Email', 'Enter your email', 'email', '', true)}
                    ${Components.inputField('Password', 'Enter your password', 'password', '', true)}
                </form>
            </div>
            
            <div>
                ${Components.button('Register', 'handleRegister()', true)}
                ${Components.bottomNavigation('tournaments')}
            </div>
        `;

        window.handleRegister = async () => {
            const form = document.getElementById('registerForm');
            const email = form.querySelector('input[type="email"]').value;
            const password = form.querySelector('input[type="password"]').value;

            try {
                await auth.register({ email, password });
                router.navigate('/');
            } catch (error) {
                alert('Registration failed: ' + error.message);
            }
        };
    }

    async renderTournaments() {
        const app = document.getElementById('app');
        
        try {
            const tournaments = await api.getTournaments();
            
            app.innerHTML = `
                <div>
                    ${Components.header('Tournaments', null, Components.addButton("router.navigate('/create-tournament')"))}
                    
                    ${tournaments.length > 0 
                        ? tournaments.map(tournament => Components.tournamentCard(tournament)).join('')
                        : '<div class="text-center text-[#9daebe] py-8">No tournaments found</div>'
                    }
                </div>
                
                <div>
                    ${Components.bottomNavigation('tournaments')}
                </div>
            `;
        } catch (error) {
            app.innerHTML = `
                <div>
                    ${Components.header('Tournaments')}
                    <div class="text-center text-red-500 py-8">Error loading tournaments: ${error.message}</div>
                </div>
                <div>
                    ${Components.bottomNavigation('tournaments')}
                </div>
            `;
        }
    }

    async renderTournamentDetail(tournamentId) {
        const app = document.getElementById('app');
        
        try {
            const tournament = await api.getTournament(tournamentId);
            
            app.innerHTML = `
                <div>
                    ${Components.header('Tournament Details', Components.backButton())}
                    
                    <div class="@container">
                        <div class="@[480px]:px-4 @[480px]:py-3">
                            <div class="bg-cover bg-center flex flex-col justify-end overflow-hidden bg-[#141a1f] @[480px]:rounded-xl min-h-[218px] bg-gradient-to-t from-black/40 to-transparent">
                                <div class="flex p-4">
                                    <p class="text-white tracking-light text-[28px] font-bold leading-tight">${tournament.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pb-3">
                        <div class="flex border-b border-[#3d4d5c] px-4 gap-8">
                            <a class="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#9daebe] pb-[13px] pt-4" href="#" onclick="showParticipants('${tournamentId}')">
                                <p class="text-[#9daebe] text-sm font-bold leading-normal tracking-[0.015em]">Participants</p>
                            </a>
                            <a class="flex flex-col items-center justify-center border-b-[3px] border-b-[#dce8f3] text-white pb-[13px] pt-4" href="#" onclick="showMatches('${tournamentId}')">
                                <p class="text-white text-sm font-bold leading-normal tracking-[0.015em]">Matches</p>
                            </a>
                        </div>
                    </div>
                    
                    <div id="tournament-content">
                        <h2 class="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Matches</h2>
                        <div class="px-4">
                            ${tournament.matches.length > 0 
                                ? tournament.matches.map(match => `
                                    <div class="flex items-stretch justify-between gap-4 rounded-xl bg-[#1f272e] p-4 shadow-[0_0_4px_rgba(0,0,0,0.1)] mb-4">
                                        <div class="flex flex-[2_2_0px] flex-col gap-4">
                                            <div class="flex flex-col gap-1">
                                                <p class="text-[#9daebe] text-sm font-normal leading-normal">Round ${match.round_number || 1}</p>
                                                <p class="text-white text-base font-bold leading-tight">Match ${match.match_number}</p>
                                                <p class="text-[#9daebe] text-sm font-normal leading-normal">Status: ${match.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')
                                : '<p class="text-[#9daebe] text-center py-8">No matches yet</p>'
                            }
                        </div>
                    </div>
                </div>
                
                <div>
                    ${Components.bottomNavigation('tournaments')}
                </div>
            `;
        } catch (error) {
            app.innerHTML = `
                <div>
                    ${Components.header('Tournament Details', Components.backButton())}
                    <div class="text-center text-red-500 py-8">Error loading tournament: ${error.message}</div>
                </div>
                <div>
                    ${Components.bottomNavigation('tournaments')}
                </div>
            `;
        }
    }

    renderProfile() {
        const app = document.getElementById('app');
        const user = auth.currentUser;
        
        app.innerHTML = `
            <div>
                ${Components.header('Profile')}
                
                <div class="px-4 py-6">
                    <div class="bg-[#1f272e] rounded-xl p-4">
                        <h3 class="text-white text-lg font-bold mb-4">User Information</h3>
                        <p class="text-[#9daebe] mb-2">Email: ${user?.email || 'Not available'}</p>
                        <p class="text-[#9daebe] mb-2">Status: ${user?.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                </div>
                
                ${Components.button('Logout', 'auth.logout()', false)}
            </div>
            
            <div>
                ${Components.bottomNavigation('profile')}
            </div>
        `;
    }

    renderSettings() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div>
                ${Components.header('Settings')}
                
                <div class="px-4 py-6">
                    <div class="bg-[#1f272e] rounded-xl p-4">
                        <h3 class="text-white text-lg font-bold mb-4">Application Settings</h3>
                        <p class="text-[#9daebe]">Settings coming soon...</p>
                    </div>
                </div>
            </div>
            
            <div>
                ${Components.bottomNavigation('settings')}
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
});

// Global functions for event handlers
window.showParticipants = async (tournamentId) => {
    // Implementation for showing participants
    console.log('Show participants for tournament:', tournamentId);
};

window.showMatches = async (tournamentId) => {
    // Implementation for showing matches
    console.log('Show matches for tournament:', tournamentId);
};