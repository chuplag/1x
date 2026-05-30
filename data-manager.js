// =============================================================================
// data-manager.js — JSONBin.io cloud sync
// All data is stored in ONE JSONBin bin as a JSON object.
// Any device that opens the app reads from the same bin automatically.
//
// SETUP (one-time, takes 2 minutes):
//   1. Go to https://jsonbin.io  →  Sign up free
//   2. Click "CREATE BIN"  →  paste this as initial content:
//      {"transactions":[],"agents":[],"balanceLogs":[]}
//      → Save  →  Copy the BIN ID from the URL  (looks like: 683abc12ad1234...)
//   3. Go to API Keys  →  Create key  →  Copy it
//   4. Paste both below:
// =============================================================================

const JSONBIN_BIN_ID  = 'YOUR_BIN_ID_HERE';   // ← paste your Bin ID
const JSONBIN_API_KEY = 'YOUR_API_KEY_HERE';   // ← paste your API key

const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const JSONBIN_HEADERS = {
    'Content-Type':  'application/json',
    'X-Master-Key':  JSONBIN_API_KEY,
    'X-Bin-Versioning': 'false',   // always overwrite latest, no version history
};

// ─── LOCAL CACHE ─────────────────────────────────────────────────────────────
// We keep a local copy in memory so reads are instant after initial load.
// Writes go to JSONBin immediately and update the cache.
let _cache = null;          // { transactions:[], agents:[], balanceLogs:[] }
let _syncing = false;
let _pendingWrite = false;

// ─── CLOUD READ ──────────────────────────────────────────────────────────────
async function _cloudLoad() {
    const res = await fetch(JSONBIN_URL + '/latest', {
        headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error('JSONBin read failed: ' + res.status);
    const json = await res.json();
    _cache = json.record || { transactions: [], agents: [], balanceLogs: [] };
    // Ensure all arrays exist
    _cache.transactions = _cache.transactions || [];
    _cache.agents       = _cache.agents       || [];
    _cache.balanceLogs  = _cache.balanceLogs  || [];
    return _cache;
}

// ─── CLOUD WRITE (debounced 400ms) ───────────────────────────────────────────
let _writeTimer = null;
function _cloudSave() {
    _pendingWrite = true;
    clearTimeout(_writeTimer);
    _writeTimer = setTimeout(async () => {
        if (_syncing) { _cloudSave(); return; }
        _syncing = true;
        _pendingWrite = false;
        try {
            await fetch(JSONBIN_URL, {
                method:  'PUT',
                headers: JSONBIN_HEADERS,
                body:    JSON.stringify(_cache),
            });
        } catch(e) {
            console.error('JSONBin write failed:', e);
        }
        _syncing = false;
    }, 400);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function _nextId(arr) {
    return arr.length ? Math.max(...arr.map(r => r.id || 0)) + 1 : 1;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
function isAuthenticated() {
    const session = localStorage.getItem('1xpartners_session');
    if (!session) return false;
    try {
        const [user, pass] = atob(session).split(':');
        return (user === 'knocker' || user === 'prasanna') && pass === 'root@knocker';
    } catch(e) { return false; }
}

function requireAuth() {
    if (!isAuthenticated()) { window.location.href = 'index.html'; return false; }
    return true;
}

function logout() {
    localStorage.removeItem('1xpartners_session');
    localStorage.removeItem('1xpartners_user');
    window.location.href = 'index.html';
}

// ─── DB INIT — loads data from JSONBin on first call ─────────────────────────
async function initDB() {
    if (_cache) return true;   // already loaded this session

    // Check if credentials are still placeholders
    if (JSONBIN_BIN_ID === 'YOUR_BIN_ID_HERE' || JSONBIN_API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('JSONBin not configured — using localStorage fallback');
        _useLocalFallback();
        return true;
    }

    try {
        await _cloudLoad();
    } catch(e) {
        console.warn('JSONBin unreachable — using localStorage fallback:', e);
        _useLocalFallback();
    }
    return true;
}

// ─── FALLBACK (localStorage) when JSONBin not yet configured ─────────────────
function _useLocalFallback() {
    if (_cache) return;
    try {
        _cache = JSON.parse(localStorage.getItem('1xp_data') || '{"transactions":[],"agents":[],"balanceLogs":[]}');
    } catch { _cache = { transactions: [], agents: [], balanceLogs: [] }; }
    // Monkey-patch _cloudSave to write localStorage instead
    _cloudSave = function() {
        clearTimeout(_writeTimer);
        _writeTimer = setTimeout(() => {
            localStorage.setItem('1xp_data', JSON.stringify(_cache));
        }, 100);
    };
}

// ─── AGENTS ──────────────────────────────────────────────────────────────────
function getAgents()       { return Promise.resolve([..._cache.agents]); }

function getAgentById(id)  { return Promise.resolve(_cache.agents.find(a => a.id === id) || null); }

function addAgent(agent) {
    const newAgent = { ...agent, id: _nextId(_cache.agents), balance: agent.balance || 0, createdAt: new Date().toISOString() };
    _cache.agents.push(newAgent);
    _cloudSave();
    return Promise.resolve(newAgent.id);
}

function updateAgentBalance(agentId, newBalance, reason, adminName = 'Admin') {
    const idx = _cache.agents.findIndex(a => a.id === agentId);
    if (idx === -1) return Promise.reject('Agent not found');
    const oldBalance = _cache.agents[idx].balance;
    _cache.agents[idx].balance = newBalance;
    _cache.balanceLogs.push({
        id: _nextId(_cache.balanceLogs), agentId,
        agentName: _cache.agents[idx].name,
        oldBalance, newBalance, adjustment: newBalance - oldBalance,
        reason, admin: adminName, timestamp: new Date().toISOString()
    });
    _cloudSave();
    return Promise.resolve(true);
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
function addTransaction(tx) {
    const newTx = { ...tx, id: _nextId(_cache.transactions), createdAt: new Date().toISOString() };
    _cache.transactions.push(newTx);
    _cloudSave();
    return Promise.resolve(newTx.id);
}

function updateTransaction(id, updatedData) {
    const idx = _cache.transactions.findIndex(t => t.id === id);
    if (idx === -1) return Promise.reject('Transaction not found');
    _cache.transactions[idx] = { ..._cache.transactions[idx], ...updatedData, updatedAt: new Date().toISOString() };
    _cloudSave();
    return Promise.resolve(true);
}

function deleteTransaction(id) {
    _cache.transactions = _cache.transactions.filter(t => t.id !== id);
    _cloudSave();
    return Promise.resolve(true);
}

function getTransactions(filters = {}) {
    let txs = [..._cache.transactions];
    if (filters.type)      txs = txs.filter(t => t.type === filters.type);
    if (filters.agentId)   txs = txs.filter(t => t.agentId === filters.agentId);
    if (filters.startDate) txs = txs.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
    if (filters.endDate)   txs = txs.filter(t => new Date(t.timestamp) <= new Date(filters.endDate));
    return Promise.resolve(txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
}

// ─── BALANCE LOGS ─────────────────────────────────────────────────────────────
function getBalanceLogs(agentId = null) {
    let logs = [..._cache.balanceLogs];
    if (agentId) logs = logs.filter(l => l.agentId === agentId);
    return Promise.resolve(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
async function generateDemoData() {
    if (_cache.agents.length > 0) return;   // already seeded

    const demoAgents = [
        { name: 'Prasanna Sharma', email: 'prasanna@1xpartners.com' },
        { name: 'Ramesh Thapa',    email: 'ramesh@1xpartners.com'   },
        { name: 'Sita Gurung',     email: 'sita@1xpartners.com'     },
        { name: 'Hari Bahadur',    email: 'hari@1xpartners.com'     },
        { name: 'Gita Karki',      email: 'gita@1xpartners.com'     },
    ];
    for (const a of demoAgents) await addAgent(a);

    const agents   = _cache.agents;
    const methods  = ['eSewa', 'Khalti', 'ConnectIPS', 'Bank Transfer'];
    const statuses = ['SUCCESS','SUCCESS','SUCCESS','SUCCESS','PENDING','FAILED'];
    const now      = new Date();

    const txBatch = [];
    for (let day = 0; day < 30; day++) {
        const dayDate = new Date(now);
        dayDate.setDate(dayDate.getDate() - day);
        const count = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
            const agent  = agents[Math.floor(Math.random() * agents.length)];
            const type   = Math.random() > 0.25 ? 'Deposit' : 'Withdrawal';
            const amount = Math.floor(250 + Math.random() * 27550);
            const ts     = new Date(dayDate);
            ts.setHours(Math.floor(Math.random()*24), Math.floor(Math.random()*60), Math.floor(Math.random()*60));
            txBatch.push({
                id:        txBatch.length + 1,
                agentId:   agent.id,
                playerId:  String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)),
                amount, type,
                method:    methods[Math.floor(Math.random() * methods.length)],
                status:    statuses[Math.floor(Math.random() * statuses.length)],
                timestamp: ts.toISOString(),
                txId:      'TX' + Math.random().toString(36).substring(2,12).toUpperCase(),
                createdAt: ts.toISOString(),
            });
        }
    }
    _cache.transactions = txBatch;

    // Compute balances from transactions
    const depTot = {}, wdTot = {};
    txBatch.filter(t => t.status === 'SUCCESS').forEach(t => {
        if (t.type === 'Deposit')    depTot[t.agentId] = (depTot[t.agentId] || 0) + t.amount;
        if (t.type === 'Withdrawal') wdTot[t.agentId]  = (wdTot[t.agentId]  || 0) + t.amount;
    });
    _cache.agents = _cache.agents.map(a => ({
        ...a, balance: Math.max(0, (depTot[a.id]||0) - (wdTot[a.id]||0))
    }));

    _cloudSave();
}

// ─── MANUAL EXPORT / IMPORT (backup, still available) ─────────────────────────
function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ..._cache }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `1xpartners-data-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.transactions) _cache.transactions = data.transactions;
                if (data.agents)       _cache.agents       = data.agents;
                if (data.balanceLogs)  _cache.balanceLogs  = data.balanceLogs;
                _cloudSave();
                resolve(true);
            } catch { reject('Invalid JSON file'); }
        };
        reader.onerror = () => reject('File read error');
        reader.readAsText(file);
    });
}

// ─── FORCE REFRESH from cloud (call to pull latest from another device) ───────
async function syncNow() {
    if (JSONBIN_BIN_ID === 'YOUR_BIN_ID_HERE') return false;
    try { await _cloudLoad(); return true; }
    catch(e) { console.error('Sync failed:', e); return false; }
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
function getDashboardStats() {
    const deps = _cache.transactions.filter(t => t.type==='Deposit'    && t.status==='SUCCESS');
    const wds  = _cache.transactions.filter(t => t.type==='Withdrawal' && t.status==='SUCCESS');
    const today = new Date(); today.setHours(0,0,0,0);
    return Promise.resolve({
        totalAgents:      _cache.agents.length,
        totalDeposits:    deps.reduce((s,t)=>s+t.amount,0),
        totalWithdrawals: wds.reduce((s,t)=>s+t.amount,0),
        todayDeposits:    deps.filter(t=>new Date(t.timestamp)>=today).reduce((s,t)=>s+t.amount,0),
        todayWithdrawals: wds.filter(t=>new Date(t.timestamp)>=today).reduce((s,t)=>s+t.amount,0),
    });
}
