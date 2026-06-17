const express = require('express');
const router = express.Router();

const { isAuthenticated, isAdmin, adminMfaRequired, conditionalAccess } = require('../middleware/auth');
const dbService = require('../services/dbService');

router.use(isAuthenticated, isAdmin, adminMfaRequired, conditionalAccess);

router.get('/dashboard', async (req, res) => {
  try {
    const logs = await dbService.getAccessLogs(50);
    res.render('admin-dashboard', {
      title: 'Panel de Administración - Cruz Azul ERP',
      user: req.session.user,
      logs,
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.render('admin-dashboard', {
      title: 'Panel de Administración - Cruz Azul ERP',
      user: req.session.user,
      logs: [],
    });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await dbService.getAccessLogs(200);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener logs.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await dbService.getPool().query(
      'SELECT id, username, email, role, mfa_enabled, active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios.' });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const result = await dbService.getPool().query(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener sesiones.' });
  }
});

router.get('/security-status', async (req, res) => {
  try {
    const recentAttempts = await dbService.getPool().query(
      `SELECT COUNT(*) as total, 
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
       SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
       FROM auth_logs WHERE attempted_at > NOW() - INTERVAL '24 hours'`
    );
    
    const activeSessions = await dbService.getPool().query(
      'SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()'
    );

    res.json({
      success: true,
      data: {
        authAttempts24h: recentAttempts.rows[0],
        activeSessions: activeSessions.rows[0].count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener estado de seguridad.' });
  }
});

module.exports = router;
