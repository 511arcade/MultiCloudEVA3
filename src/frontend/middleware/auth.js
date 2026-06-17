const jwt = require('jsonwebtoken');

function isAuthenticated(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.session.authenticated = true;
      req.session.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  }
  
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }
    return res.status(403).render('error', {
      title: 'Acceso Denegado',
      message: 'No tiene permisos de administrador para acceder a esta sección.',
    });
  }
  next();
}

function mfaRequired(req, res, next) {
  if (!req.session.mfaVerified) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ error: 'Verificación MFA requerida' });
    }
    return res.redirect('/mfa/verify');
  }
  next();
}

function adminMfaRequired(req, res, next) {
  if (!req.session.mfaVerified) {
    return res.redirect('/mfa/verify');
  }
  if (!req.session.sshVerified && req.session.user?.role === 'admin') {
    return res.redirect('/mfa/ssh-verify');
  }
  next();
}

function conditionalAccess(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const user = req.session.user;

  if (!user) return res.redirect('/login');

  const rules = {
    blockedCountries: ['XX', 'YY'],
    requiredUserAgent: user.role === 'admin' ? /Mozilla|Chrome|Firefox/i : null,
    ipWhitelist: process.env.ADMIN_IPS?.split(',') || [],
  };

  if (user.role === 'admin' && rules.ipWhitelist.length > 0) {
    const clientIP = ip.replace(/^::ffff:/, '');
    if (!rules.ipWhitelist.includes(clientIP)) {
      console.warn(`[CONDITIONAL ACCESS] Acceso denegado para IP ${clientIP} (admin)`);
      return res.status(403).render('error', {
        title: 'Acceso Restringido',
        message: 'Su dirección IP no está autorizada para acceder como administrador desde esta ubicación.',
      });
    }
  }

  if (user.role === 'admin' && rules.requiredUserAgent) {
    if (!rules.requiredUserAgent.test(userAgent)) {
      return res.status(403).render('error', {
        title: 'Acceso Restringido',
        message: 'User-Agent no válido para acceso administrativo.',
      });
    }
  }

  next();
}

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  isAuthenticated,
  isAdmin,
  mfaRequired,
  adminMfaRequired,
  conditionalAccess,
  generateToken,
  verifyToken,
};
