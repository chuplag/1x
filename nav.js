// nav.js - handles responsive sidebar + hamburger menu
function initNav() {
    // Create sidebar structure dynamically (or we can embed HTML in each page)
    // For simplicity, we'll inject the menu HTML via JS to keep code DRY.
    // This function will be called on DOMContentLoaded.
    const sidebarHTML = `
        <aside class="sidebar" id="mainSidebar">
            <div class="logo"><span>1x<em>PARTNERS</em></span></div>
            <div class="nav-section">
                <div class="nav-label">Main Menu</div>
                <a href="1xpartners-dashboard.html" class="nav-item"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
                <a href="admin.html" class="nav-item" id="adminNavLink"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Admin Panel</a>
                <a href="depowd.html" class="nav-item"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Deposit</a>
                <a href="depowd.html" class="nav-item"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>Withdraw</a>
                <a href="withdr.html" class="nav-item problem-link"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Withdrawal Problem</a>
                <a href="#" class="nav-item" onclick="logout(); return false;"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</a>
            </div>
        </aside>
        <div class="mobile-header">
            <button class="hamburger" id="hamburgerBtn">☰</button>
            <div class="mobile-logo">1xPARTNERS</div>
            <div></div>
        </div>
        <div class="overlay" id="overlay"></div>
    `;

    // Insert sidebar and mobile header into body (if not already present)
    if (!document.querySelector('.sidebar')) {
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    // Hide admin link if not admin
    const sessionUser = localStorage.getItem('1xpartners_user');
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink && sessionUser !== 'knocker') {
        adminLink.style.display = 'none';
    }

    // Hamburger logic
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('overlay');
    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}
