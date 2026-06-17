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

router.get('/logs/page', async (req, res) => {
  try {
    const logs = await dbService.getAccessLogs(200);
    res.render('admin-logs', {
      title: 'Logs de Acceso - Cruz Azul ERP',
      user: req.session.user,
      logs,
    });
  } catch (err) {
    res.render('admin-logs', {
      title: 'Logs de Acceso - Cruz Azul ERP',
      user: req.session.user,
      logs: [],
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await dbService.findAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios.' });
  }
});

router.get('/users/page', async (req, res) => {
  try {
    const users = await dbService.findAllUsers();
    res.render('admin-users', {
      title: 'Usuarios - Cruz Azul ERP',
      user: req.session.user,
      users,
    });
  } catch (err) {
    res.render('admin-users', {
      title: 'Usuarios - Cruz Azul ERP',
      user: req.session.user,
      users: [],
    });
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

router.get('/sessions/page', async (req, res) => {
  try {
    const sessions = await dbService.getPool().query(
      'SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50'
    );
    res.render('admin-sessions', {
      title: 'Sesiones - Cruz Azul ERP',
      user: req.session.user,
      sessions: sessions.rows,
    });
  } catch (err) {
    res.render('admin-sessions', {
      title: 'Sesiones - Cruz Azul ERP',
      user: req.session.user,
      sessions: [],
    });
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

router.get('/security/page', async (req, res) => {
  try {
    const logs = await dbService.getAccessLogs(100);
    res.render('admin-security', {
      title: 'Estado de Seguridad - Cruz Azul ERP',
      user: req.session.user,
      logs,
    });
  } catch (err) {
    res.render('admin-security', {
      title: 'Estado de Seguridad - Cruz Azul ERP',
      user: req.session.user,
      logs: [],
    });
  }
});

module.exports = router;
