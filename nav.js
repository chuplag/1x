// nav.js - Unified Navigation
function initNav() {
    const oldSidebar = document.querySelector('.sidebar');
    if (oldSidebar) oldSidebar.remove();
    const oldMobileHeader = document.querySelector('.mobile-header');
    if (oldMobileHeader) oldMobileHeader.remove();
    const oldOverlay = document.querySelector('.overlay');
    if (oldOverlay) oldOverlay.remove();
    const oldTopBar = document.querySelector('.app-top-bar');
    if (oldTopBar) oldTopBar.remove();
    const oldBottomNav = document.querySelector('.bottom-nav');
    if (oldBottomNav) oldBottomNav.remove();

    const userName = localStorage.getItem('1xpartners_user') || 'Partner';
    const affId = '4101738';
    const isAdmin = userName === 'knocker';

    const topBarHTML = `
        <div class="app-top-bar">
            <div class="user-info">
                <div class="user-name">${isAdmin ? '👑 Admin' : userName}</div>
                <div class="aff-id">Aff ID: ${affId}</div>
            </div>
            <div class="top-actions">
                <button class="icon-btn" onclick="logout()" title="Logout">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', topBarHTML);

    const currentPage = window.location.pathname.split('/').pop() || '1xpartners-dashboard.html';

    const navItems = [
        { href: '1xpartners-dashboard.html', page: '1xpartners-dashboard.html', icon: homeIcon(), label: 'Home' },
        { href: 'depowd.html', page: 'depowd.html', icon: walletIcon(), label: 'Finance' },
        { href: 'reports.html', page: 'reports.html', icon: reportIcon(), label: 'Reports' },
        { href: 'settings.html', page: 'settings.html', icon: settingsIcon(), label: 'Settings' },
    ];

    const bottomNavHTML = `
        <nav class="bottom-nav">
            ${navItems.map(n => `
                <a href="${n.href}" class="nav-item ${currentPage === n.page ? 'active' : ''}">
                    <span class="nav-icon">${n.icon}</span>
                    <span class="nav-label">${n.label}</span>
                </a>
            `).join('')}
        </nav>
    `;
    document.body.insertAdjacentHTML('beforeend', bottomNavHTML);

    const main = document.querySelector('.main, .main-content, .admin-container');
    if (main) main.style.paddingBottom = '80px';
}

function homeIcon() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
}
function walletIcon() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`;
}
function reportIcon() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15C3.1 3 2 4.1 2 5.25V19a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>`;
}
function settingsIcon() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.97 6.97 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>`;
}
