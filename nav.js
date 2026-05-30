// nav.js - Unified Navigation with Bottom Tab Bar
function initNav() {
    // Remove old sidebar if exists
    const oldSidebar = document.querySelector('.sidebar');
    if (oldSidebar) oldSidebar.remove();
    const oldMobileHeader = document.querySelector('.mobile-header');
    if (oldMobileHeader) oldMobileHeader.remove();
    const oldOverlay = document.querySelector('.overlay');
    if (oldOverlay) oldOverlay.remove();

    // Get current user
    const userName = localStorage.getItem('1xpartners_user') || 'Partner';
    const affId = '4101738';

    // Insert top bar
    const topBarHTML = `
        <div class="app-top-bar">
            <div class="user-info">
                <div class="user-name">${userName === 'knocker' ? 'Admin' : userName}</div>
                <div class="aff-id">Aff ID: ${affId}</div>
            </div>
            <div class="top-actions">
                <button class="icon-btn" id="logoutTopBtn" onclick="logout()">🚪</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', topBarHTML);

    // Insert bottom navigation
    const currentPage = window.location.pathname.split('/').pop() || '1xpartners-dashboard.html';
    const bottomNavHTML = `
        <nav class="bottom-nav">
            <a href="1xpartners-dashboard.html" class="nav-item ${currentPage === '1xpartners-dashboard.html' ? 'active' : ''}">
                <span class="nav-icon">🏠</span>
                <span class="nav-label">Home page</span>
            </a>
            <a href="reports.html" class="nav-item ${currentPage === 'reports.html' ? 'active' : ''}">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Reports</span>
            </a>
            <a href="marketing.html" class="nav-item ${currentPage === 'marketing.html' ? 'active' : ''}">
                <span class="nav-icon">📢</span>
                <span class="nav-label">Marketing</span>
            </a>
            <a href="settings.html" class="nav-item ${currentPage === 'settings.html' ? 'active' : ''}">
                <span class="nav-icon">⚙️</span>
                <span class="nav-label">Settings</span>
            </a>
        </nav>
    `;
    document.body.insertAdjacentHTML('beforeend', bottomNavHTML);

    // Add padding to main content to avoid overlap with bottom nav
    const mainContent = document.querySelector('.main, .main-content');
    if (mainContent) mainContent.style.paddingBottom = '70px';
}
