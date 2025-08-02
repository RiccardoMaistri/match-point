class Components {
    static bottomNavigation(activeTab = 'home') {
        const tabs = [
            { id: 'home', icon: 'House', label: 'Home', route: '/' },
            { id: 'tournaments', icon: 'Trophy', label: 'Tournaments', route: '/tournaments' },
            { id: 'profile', icon: 'User', label: 'Profile', route: '/profile' },
            { id: 'settings', icon: 'Gear', label: 'Settings', route: '/settings' }
        ];

        return `
            <div class="flex gap-2 border-t border-[#2b3640] bg-[#1f272e] px-4 pb-3 pt-2">
                ${tabs.map(tab => `
                    <a class="just flex flex-1 flex-col items-center justify-end gap-1 ${tab.id === activeTab ? 'rounded-full text-white' : 'text-[#9daebe]'}" 
                       href="#" onclick="router.navigate('${tab.route}')">
                        <div class="${tab.id === activeTab ? 'text-white' : 'text-[#9daebe]'} flex h-8 items-center justify-center" data-icon="${tab.icon}" data-size="24px" data-weight="${tab.id === activeTab ? 'fill' : 'regular'}">
                            ${this.getIcon(tab.icon, tab.id === activeTab)}
                        </div>
                        <p class="${tab.id === activeTab ? 'text-white' : 'text-[#9daebe]'} text-xs font-medium leading-normal tracking-[0.015em]">${tab.label}</p>
                    </a>
                `).join('')}
            </div>
            <div class="h-5 bg-[#1f272e]"></div>
        `;
    }

    static header(title, leftButton = null, rightButton = null) {
        return `
            <div class="flex items-center bg-[#141a1f] p-4 pb-2 justify-between">
                ${leftButton || '<div class="w-12"></div>'}
                <h2 class="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center ${leftButton ? 'pr-12' : ''} ${rightButton ? 'pl-12' : ''}">${title}</h2>
                ${rightButton || '<div class="w-12"></div>'}
            </div>
        `;
    }

    static backButton(onClick = 'history.back()') {
        return `
            <div class="text-white flex size-12 shrink-0 items-center cursor-pointer" onclick="${onClick}">
                ${this.getIcon('ArrowLeft')}
            </div>
        `;
    }

    static closeButton(onClick = 'history.back()') {
        return `
            <div class="text-white flex size-12 shrink-0 items-center cursor-pointer" onclick="${onClick}">
                ${this.getIcon('X')}
            </div>
        `;
    }

    static addButton(onClick) {
        return `
            <div class="flex w-12 items-center justify-end">
                <button class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0" onclick="${onClick}">
                    ${this.getIcon('Plus')}
                </button>
            </div>
        `;
    }

    static tournamentCard(tournament) {
        return `
            <div class="flex items-center gap-4 bg-[#141a1f] px-4 min-h-[72px] py-2 justify-between cursor-pointer" onclick="router.navigate('/tournament/${tournament.id}')">
                <div class="flex items-center gap-4">
                    <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14 bg-[#2b3640] flex items-center justify-center">
                        ${this.getIcon('Trophy')}
                    </div>
                    <div class="flex flex-col justify-center">
                        <p class="text-white text-base font-medium leading-normal line-clamp-1">${tournament.name}</p>
                        <p class="text-[#9daebe] text-sm font-normal leading-normal line-clamp-2">${tournament.tournament_type} | ${tournament.format}</p>
                    </div>
                </div>
                <div class="shrink-0">
                    <button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#2b3640] text-white text-sm font-medium leading-normal w-fit">
                        <span class="truncate">View</span>
                    </button>
                </div>
            </div>
        `;
    }

    static inputField(label, placeholder, type = 'text', value = '', required = false) {
        return `
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label class="flex flex-col min-w-40 flex-1">
                    <p class="text-white text-base font-medium leading-normal pb-2">${label}</p>
                    <input type="${type}" placeholder="${placeholder}" value="${value}" ${required ? 'required' : ''}
                           class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#2b3640] focus:border-none h-14 placeholder:text-[#9daebe] p-4 text-base font-normal leading-normal">
                </label>
            </div>
        `;
    }

    static button(text, onClick, primary = true) {
        const classes = primary 
            ? 'bg-[#dce8f3] text-[#141a1f]' 
            : 'bg-[#2b3640] text-white';
        
        return `
            <div class="flex px-4 py-3">
                <button onclick="${onClick}" class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 flex-1 ${classes} text-base font-bold leading-normal tracking-[0.015em]">
                    <span class="truncate">${text}</span>
                </button>
            </div>
        `;
    }

    static getIcon(iconName, filled = false) {
        const icons = {
            House: filled 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path></svg>',
            Trophy: filled
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M232,64H208V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56v8H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z"></path></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M232,64H208V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56v8H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8Zm144-8.9c0,35.52-28.49,64.64-63.51,64.9H128a64,64,0,0,1-64-64V56H192ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z"></path></svg>',
            User: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path></svg>',
            Gear: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"></path></svg>',
            Plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>',
            ArrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path></svg>',
            X: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>'
        };
        return icons[iconName] || '';
    }
}