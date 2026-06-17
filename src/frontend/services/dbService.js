const { Pool } = require('pg');

let pool = null;

function getPool() {
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
      ssl: {
        rejectUnauthorized: true,
      },
    });

    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de conexiones PostgreSQL:', err);
    });
  }
  return pool;
}

async function testConnection() {
  const client = await getPool().connect();
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function findUserByUsername(username) {
  const result = await getPool().query(
    'SELECT id, username, email, password_hash, role, mfa_enabled, mfa_secret, backup_codes, created_at, last_login FROM users WHERE username = $1 AND active = true',
    [username]
  );
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const result = await getPool().query(
    'SELECT id, username, email, role FROM users WHERE email = $1 AND active = true',
    [email]
  );
  return result.rows[0] || null;
}

async function createUser(username, email, passwordHash, role = 'user') {
  const result = await getPool().query(
    `INSERT INTO users (username, email, password_hash, role, mfa_enabled, active)
     VALUES ($1, $2, $3, $4, false, true)
     RETURNING id, username, email, role, created_at`,
    [username, email, passwordHash, role]
  );
  return result.rows[0];
}

async function updateLastLogin(userId) {
  await getPool().query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  );
}

async function enableMFA(userId, secret) {
  await getPool().query(
    'UPDATE users SET mfa_enabled = true, mfa_secret = $2 WHERE id = $1',
    [userId, secret]
  );
}

async function saveBackupCodes(userId, codes) {
  await getPool().query(
    'UPDATE users SET backup_codes = $2 WHERE id = $1',
    [userId, JSON.stringify(codes)]
  );
}

async function getBackupCodes(userId) {
  const result = await getPool().query(
    'SELECT backup_codes FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows[0]?.backup_codes) {
    return JSON.parse(result.rows[0].backup_codes);
  }
  return [];
}

async function logAuthAttempt(username, success, ipAddress, details = null) {
  await getPool().query(
    `INSERT INTO auth_logs (username, success, ip_address, details, attempted_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [username, success, ipAddress, details]
  );
}

async function getAccessLogs(limit = 100) {
  const result = await getPool().query(
    'SELECT * FROM auth_logs ORDER BY attempted_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

async function getSessionInfo(sessionId) {
  const result = await getPool().query(
    'SELECT * FROM sessions WHERE session_id = $1',
    [sessionId]
  );
  return result.rows[0] || null;
}

async function auditLog(userId, action, details, ipAddress) {
  await getPool().query(
    `INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId, action, details, ipAddress]
  );
}

module.exports = {
  getPool,
  testConnection,
  findUserByUsername,
  findUserByEmail,
  createUser,
  updateLastLogin,
  enableMFA,
  saveBackupCodes,
  getBackupCodes,
  logAuthAttempt,
  getAccessLogs,
  getSessionInfo,
  auditLog,
};
