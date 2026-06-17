const express = require('express');
const router = express.Router();

const { isAuthenticated, generateToken } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/rateLimiter');
const dbService = require('../services/dbService');

router.use(apiRateLimit);

router.get('/health', async (req, res) => {
  try {
    const dbStatus = await dbService.testConnection();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
});

router.get('/token/refresh', isAuthenticated, (req, res) => {
  if (!req.session.fullAuth) {
    return res.status(403).json({ error: 'Autenticación completa requerida para refrescar token.' });
  }

  const token = generateToken({
    id: req.session.user.id,
    username: req.session.user.username,
    role: req.session.user.role,
  });

  req.session.token = token;
  res.json({
    success: true,
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
});

router.get('/user/profile', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.session.user.id,
      username: req.session.user.username,
      email: req.session.user.email,
      role: req.session.user.role,
      mfaEnabled: req.session.mfaVerified || false,
      authenticated: req.session.authenticated,
      fullAuth: req.session.fullAuth || false,
    },
  });
});

router.get('/dashboard/data', isAuthenticated, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        welcome: `Bienvenido ${req.session.user.username}`,
        role: req.session.user.role,
        lastAccess: req.session.cookie?.expires,
        stats: {
          mfaEnabled: req.session.mfaVerified || false,
          authenticationLevel: req.session.fullAuth ? 'Completa' : 'Parcial',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener datos del dashboard.' });
  }
});

module.exports = router;
