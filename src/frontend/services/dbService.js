const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;
let useMemoryFallback = false;

const memDB = {
  users: [],
  authLogs: [],
  sessions: [],
  auditLogs: [],
  nextId: 1,
};

async function initMemoryUsers() {
  if (memDB.users.length > 0) return;
  const hash = await bcrypt.hash('CruzAzul2024!', 10);
  memDB.users.push({
    id: 1, username: 'admin.cruzazul', email: 'admin@cruzazul.cl',
    password_hash: hash, role: 'admin', mfa_enabled: false,
    mfa_secret: null, backup_codes: '[]', active: true,
    created_at: new Date(), last_login: null,
  });
  memDB.users.push({
    id: 2, username: 'operador1', email: 'operador1@cruzazul.cl',
    password_hash: hash, role: 'user', mfa_enabled: false,
    mfa_secret: null, backup_codes: '[]', active: true,
    created_at: new Date(), last_login: null,
  });
  memDB.nextId = 3;
}

function getPool() {
  if (useMemoryFallback) return null;
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: true },
    });
    pool.on('error', (err) => {
      console.error('Error en pool PostgreSQL:', err.message);
      console.log('[DB] Cambiando a modo demo (memoria)');
      useMemoryFallback = true;
    });
  }
  return pool;
}

async function testConnection() {
  if (useMemoryFallback) {
    return { current_time: new Date().toISOString(), db_version: 'PostgreSQL (modo demo)' };
  }
  try {
    const client = await getPool().connect();
    try {
      return (await client.query('SELECT NOW() as current_time, version() as db_version')).rows[0];
    } finally {
      client.release();
    }
  } catch (err) {
    console.log('[DB] PostgreSQL no disponible, usando demo mode:', err.message);
    useMemoryFallback = true;
    await initMemoryUsers();
    return { current_time: new Date().toISOString(), db_version: 'PostgreSQL (modo demo)' };
  }
}

async function findUserByUsername(username) {
  if (useMemoryFallback) return memDB.users.find(u => u.username === username && u.active) || null;
  try {
    const r = await getPool().query('SELECT id, username, email, password_hash, role, mfa_enabled, mfa_secret, backup_codes, created_at, last_login FROM users WHERE username = $1 AND active = true', [username]);
    return r.rows[0] || null;
  } catch { useMemoryFallback = true; return findUserByUsername(username); }
}

async function findUserByEmail(email) {
  if (useMemoryFallback) return memDB.users.find(u => u.email === email && u.active) || null;
  try {
    const r = await getPool().query('SELECT id, username, email, role FROM users WHERE email = $1 AND active = true', [email]);
    return r.rows[0] || null;
  } catch { useMemoryFallback = true; return findUserByEmail(email); }
}

async function createUser(username, email, passwordHash, role = 'user') {
  if (useMemoryFallback) {
    const u = { id: memDB.nextId++, username, email, password_hash: passwordHash, role, mfa_enabled: false, mfa_secret: null, backup_codes: '[]', active: true, created_at: new Date(), last_login: null };
    memDB.users.push(u);
    return { id: u.id, username, email, role, created_at: u.created_at };
  }
  try {
    const r = await getPool().query('INSERT INTO users (username, email, password_hash, role, mfa_enabled, active) VALUES ($1,$2,$3,$4,false,true) RETURNING id, username, email, role, created_at', [username, email, passwordHash, role]);
    return r.rows[0];
  } catch { useMemoryFallback = true; return createUser(username, email, passwordHash, role); }
}

async function updateLastLogin(userId) {
  if (useMemoryFallback) { const u = memDB.users.find(x => x.id === userId); if (u) u.last_login = new Date(); return; }
  try { await getPool().query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]); } catch { useMemoryFallback = true; }
}

async function enableMFA(userId, secret) {
  if (useMemoryFallback) { const u = memDB.users.find(x => x.id === userId); if (u) { u.mfa_enabled = true; u.mfa_secret = secret; } return; }
  try { await getPool().query('UPDATE users SET mfa_enabled = true, mfa_secret = $2 WHERE id = $1', [userId, secret]); } catch { useMemoryFallback = true; }
}

async function saveBackupCodes(userId, codes) {
  if (useMemoryFallback) { const u = memDB.users.find(x => x.id === userId); if (u) u.backup_codes = JSON.stringify(codes); return; }
  try { await getPool().query('UPDATE users SET backup_codes = $2 WHERE id = $1', [userId, JSON.stringify(codes)]); } catch { useMemoryFallback = true; }
}

async function getBackupCodes(userId) {
  if (useMemoryFallback) { const u = memDB.users.find(x => x.id === userId); return u ? JSON.parse(u.backup_codes || '[]') : []; }
  try { const r = await getPool().query('SELECT backup_codes FROM users WHERE id = $1', [userId]); return r.rows[0]?.backup_codes ? JSON.parse(r.rows[0].backup_codes) : []; } catch { useMemoryFallback = true; return getBackupCodes(userId); }
}

async function findAllUsers() {
  if (useMemoryFallback) return memDB.users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, mfa_enabled: u.mfa_enabled, active: u.active, created_at: u.created_at, last_login: u.last_login }));
  try { const r = await getPool().query('SELECT id, username, email, role, mfa_enabled, active, created_at, last_login FROM users ORDER BY created_at DESC'); return r.rows; } catch { useMemoryFallback = true; return findAllUsers(); }
}

async function logAuthAttempt(username, success, ipAddress, details = null) {
  if (useMemoryFallback) { memDB.authLogs.push({ id: memDB.authLogs.length + 1, username, success, ip_address: ipAddress, details, attempted_at: new Date() }); return; }
  try { await getPool().query('INSERT INTO auth_logs (username, success, ip_address, details, attempted_at) VALUES ($1,$2,$3,$4,NOW())', [username, success, ipAddress, details]); } catch { useMemoryFallback = true; }
}

async function getAccessLogs(limit = 100) {
  if (useMemoryFallback) return memDB.authLogs.slice(-limit).reverse();
  try { const r = await getPool().query('SELECT * FROM auth_logs ORDER BY attempted_at DESC LIMIT $1', [limit]); return r.rows; } catch { useMemoryFallback = true; return getAccessLogs(limit); }
}

async function getSessionInfo(sessionId) {
  if (useMemoryFallback) return memDB.sessions.find(s => s.session_id === sessionId) || null;
  try { const r = await getPool().query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]); return r.rows[0] || null; } catch { useMemoryFallback = true; return null; }
}

async function auditLog(userId, action, details, ipAddress) {
  if (useMemoryFallback) { memDB.auditLogs.push({ id: memDB.auditLogs.length + 1, user_id: userId, action, details, ip_address: ipAddress, created_at: new Date() }); return; }
  try { await getPool().query('INSERT INTO audit_logs (user_id, action, details, ip_address, created_at) VALUES ($1,$2,$3,$4,NOW())', [userId, action, details, ipAddress]); } catch { useMemoryFallback = true; }
}

initMemoryUsers();

module.exports = {
  getPool, testConnection, findUserByUsername, findUserByEmail, findAllUsers,
  createUser, updateLastLogin, enableMFA, saveBackupCodes,
  getBackupCodes, logAuthAttempt, getAccessLogs, getSessionInfo, auditLog,
};
