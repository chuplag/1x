// data-manager.js - Centralized Data Service withrs
const DB_NAME = '1xPartnersDB';
const DB_VERSION = 1;
let dbInstance = null;

// ---------- AUTH HELPERS ----------
function isAuthenticated() {
    const session = localStorage.getItem('1xpartners_session');
    if (!session) return false;
    try {
        const decoded = atob(session);
        const [user, pass] = decoded.split(':');
        return (user === 'knocker' && pass === 'Knocker99@');
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

// ---------- DATABASE INIT ----------
function initDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) { resolve(dbInstance); return; }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { dbInstance = request.result; resolve(dbInstance); };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('agents')) {
                const agentStore = db.createObjectStore('agents', { keyPath: 'id', autoIncrement: true });
                agentStore.createIndex('email', 'email', { unique: true });
            }
            if (!db.objectStoreNames.contains('transactions')) {
                const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                txStore.createIndex('agentId', 'agentId');
                txStore.createIndex('type', 'type');
                txStore.createIndex('timestamp', 'timestamp');
            }
            if (!db.objectStoreNames.contains('balanceLogs')) {
                db.createObjectStore('balanceLogs', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config', { keyPath: 'key' });
            }
        };
    });
}

// ---------- AGENT OPERATIONS ----------
async function getAgents() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('agents', 'readonly');
        const request = tx.objectStore('agents').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function addAgent(agent) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('agents', 'readwrite');
        const request = tx.objectStore('agents').add({ ...agent, balance: agent.balance || 0, createdAt: new Date().toISOString() });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateAgentBalance(agentId, newBalance, reason, adminName = 'Admin') {
    const db = await initDB();
    const agent = await getAgentById(agentId);
    if (!agent) throw new Error('Agent not found');
    const oldBalance = agent.balance;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['agents', 'balanceLogs'], 'readwrite');
        const agentStore = tx.objectStore('agents');
        const logStore = tx.objectStore('balanceLogs');
        agentStore.put({ ...agent, balance: newBalance }).onsuccess = () => {
            logStore.add({
                agentId, agentName: agent.name, oldBalance, newBalance,
                adjustment: newBalance - oldBalance, reason, admin: adminName,
                timestamp: new Date().toISOString()
            }).onsuccess = () => resolve(true);
        };
        request.onerror = () => reject(request.error);
    });
}

async function getAgentById(id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const request = db.transaction('agents', 'readonly').objectStore('agents').get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ---------- TRANSACTION OPERATIONS ----------
async function addTransaction(tx) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('transactions', 'readwrite');
        const request = transaction.objectStore('transactions').add({
            ...tx,
            createdAt: new Date().toISOString()
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ---------- UPDATE & DELETE TRANSACTIONS ----------
async function updateTransaction(id, updatedData) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const oldTx = getRequest.result;
            if (!oldTx) return reject('Transaction not found');
            const newTx = { ...oldTx, ...updatedData, updatedAt: new Date().toISOString() };
            const putRequest = store.put(newTx);
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

async function deleteTransaction(id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const request = tx.objectStore('transactions').delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

async function getTransactions(filters = {}) {
    const db = await initDB();
    let transactions = await new Promise((resolve, reject) => {
        const request = db.transaction('transactions', 'readonly').objectStore('transactions').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
    if (filters.type) transactions = transactions.filter(t => t.type === filters.type);
    if (filters.agentId) transactions = transactions.filter(t => t.agentId === filters.agentId);
    if (filters.startDate) transactions = transactions.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
    if (filters.endDate) transactions = transactions.filter(t => new Date(t.timestamp) <= new Date(filters.endDate));
    return transactions.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function getBalanceLogs(agentId = null) {
    const db = await initDB();
    let logs = await new Promise((resolve, reject) => {
        const request = db.transaction('balanceLogs', 'readonly').objectStore('balanceLogs').getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
    if (agentId) logs = logs.filter(l => l.agentId === agentId);
    return logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ---------- DEMO DATA GENERATION ----------
async function generateDemoData() {
    const existing = await getAgents();
    if (existing.length > 0) return;
    const demoAgents = [
        { name: 'Prasanna Sharma', email: 'prasanna@1xpartners.com', balance: 12500, phone: '9841234567' },
        { name: 'Ramesh Thapa', email: 'ramesh@1xpartners.com', balance: 8750, phone: '9812345678' },
        { name: 'Sita Gurung', email: 'sita@1xpartners.com', balance: 22340, phone: '9856789123' },
        { name: 'Hari Bahadur', email: 'hari@1xpartners.com', balance: 5600, phone: '9865432109' },
        { name: 'Gita Karki', email: 'gita@1xpartners.com', balance: 18900, phone: '9801122334' }
    ];
    for (const a of demoAgents) await addAgent(a);
    const agents = await getAgents();
    const methods = ['eSewa', 'Khalti', 'ConnectIPS', 'Bank Transfer'];
    const endDate = new Date();
    const startDate = new Date(); startDate.setDate(startDate.getDate() - 30);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dailyTx = 950 + Math.floor(Math.random() * 100);
        for (let i = 0; i < dailyTx; i++) {
            const agent = agents[Math.floor(Math.random() * agents.length)];
            const type = Math.random() > 0.2 ? 'Deposit' : 'Withdrawal';
            const amount = Math.floor(Math.random() * (27800 - 250 + 1) + 250);
            const timestamp = new Date(d);
            timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
            await addTransaction({
                agentId: agent.id, playerId: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
                amount, type, method: methods[Math.floor(Math.random() * methods.length)],
                status: 'SUCCESS', timestamp: timestamp.toISOString(),
                txId: 'TX' + Math.random().toString(36).substring(2, 15).toUpperCase()
            });
        }
    }
}

async function getDashboardStats() {
    const transactions = await getTransactions();
    const agents = await getAgents();
    const deposits = transactions.filter(t => t.type === 'Deposit' && t.status === 'SUCCESS');
    const withdrawals = transactions.filter(t => t.type === 'Withdrawal' && t.status === 'SUCCESS');
    const totalDeposits = deposits.reduce((s,t) => s + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((s,t) => s + t.amount, 0);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayDeposits = deposits.filter(t => new Date(t.timestamp) >= today).reduce((s,t) => s + t.amount, 0);
    const todayWithdrawals = withdrawals.filter(t => new Date(t.timestamp) >= today).reduce((s,t) => s + t.amount, 0);
    const last30Days = new Date(); last30Days.setDate(last30Days.getDate() - 30);
    const last30Deposits = deposits.filter(t => new Date(t.timestamp) >= last30Days).reduce((s,t) => s + t.amount, 0);
    return { totalAgents: agents.length, totalDeposits, totalWithdrawals, todayDeposits, todayWithdrawals, last30Deposits };
}
