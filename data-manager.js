// --- Auth Helper ---
function isAuthenticated() {
    const session = localStorage.getItem('1xpartners_session');
    if (!session) return false;
    try {
        const decoded = atob(session);
        const [user, pass] = decoded.split(':');
        return (user === 'prasanna' && pass === 'root@knocker') || (user === 'knocker' && pass === 'Knocker99@');
    } catch(e) { return false; }
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('1xpartners_session');
    localStorage.removeItem('1xpartners_user');
    window.location.href = 'index.html';
}

// Call this on every protected page
if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('index.html')) {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}
