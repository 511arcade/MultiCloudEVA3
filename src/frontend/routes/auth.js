const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const dbService = require('../services/dbService');
const MFAService = require('../services/mfaService');
const { loginRateLimit, mfaRateLimit } = require('../middleware/rateLimiter');
const { isAuthenticated, generateToken } = require('../middleware/auth');

router.get('/login', (req, res) => {
  if (req.session.authenticated) {
    return res.redirect('/');
  }
  res.render('login', {
    title: 'Iniciar Sesión - Cruz Azul ERP',
    error: null,
  });
});

router.post('/login', loginRateLimit, [
  body('username').trim().isLength({ min: 3, max: 50 }).escape(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Iniciar Sesión - Cruz Azul ERP',
      error: 'Datos de entrada inválidos.',
    });
  }

  const { username, password } = req.body;

  try {
    const user = await dbService.findUserByUsername(username);

    if (!user) {
      await dbService.logAuthAttempt(username, false, req.ip, 'Usuario no encontrado');
      return res.render('login', {
        title: 'Iniciar Sesión - Cruz Azul ERP',
        error: 'Credenciales inválidas.',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await dbService.logAuthAttempt(username, false, req.ip, 'Contraseña incorrecta');
      return res.render('login', {
        title: 'Iniciar Sesión - Cruz Azul ERP',
        error: 'Credenciales inválidas.',
      });
    }

    await dbService.updateLastLogin(user.id);
    await dbService.logAuthAttempt(username, true, req.ip, 'Autenticación exitosa - Paso 1');

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    req.session.authenticated = true;
    req.session.mfaRequired = user.mfa_enabled;

    req.session.step1Completed = true;

    if (user.mfa_enabled) {
      return res.redirect('/mfa/verify');
    }

    req.session.mfaVerified = true;
    req.session.fullAuth = true;

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    req.session.token = token;

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error en login:', err);
    res.render('login', {
      title: 'Iniciar Sesión - Cruz Azul ERP',
      error: 'Error interno del servidor. Intente nuevamente.',
    });
  }
});

router.get('/mfa/verify', isAuthenticated, (req, res) => {
  if (req.session.mfaVerified) {
    return res.redirect('/');
  }
  res.render('mfa-verify', {
    title: 'Verificación MFA - Cruz Azul ERP',
    error: null,
    step2: true,
  });
});

router.post('/mfa/verify', isAuthenticated, mfaRateLimit, async (req, res) => {
  const { token } = req.body;
  const username = req.session.user.username;

  try {
    const isValid = MFAService.verifyTOTP(token, username);

    if (!isValid) {
      const backupCodes = await dbService.getBackupCodes(req.session.user.id);
      if (backupCodes.length > 0 && MFAService.verifyBackupCode(token, backupCodes)) {
        await dbService.saveBackupCodes(req.session.user.id, backupCodes);
      } else {
        await dbService.logAuthAttempt(username, false, req.ip, 'MFA: Token TOTP inválido');
        return res.render('mfa-verify', {
          title: 'Verificación MFA - Cruz Azul ERP',
          error: 'Código de verificación inválido. Intente nuevamente.',
          step2: true,
        });
      }
    }

    req.session.mfaVerified = true;
    await dbService.logAuthAttempt(username, true, req.ip, 'MFA: Verificación TOTP exitosa - Paso 2');

    if (req.session.user.role === 'admin') {
      return res.redirect('/mfa/ssh-verify');
    }

    req.session.fullAuth = true;
    const tokenJWT = generateToken({
      id: req.session.user.id,
      username: req.session.user.username,
      role: req.session.user.role,
    });
    req.session.token = tokenJWT;

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error en MFA verify:', err);
    res.render('mfa-verify', {
      title: 'Verificación MFA - Cruz Azul ERP',
      error: 'Error interno del servidor.',
      step2: true,
    });
  }
});

router.get('/mfa/ssh-verify', isAuthenticated, (req, res) => {
  if (!req.session.mfaVerified) {
    return res.redirect('/mfa/verify');
  }
  if (req.session.sshVerified) {
    return res.redirect('/admin/dashboard');
  }
  res.render('mfa-verify', {
    title: 'Verificación SSH - Cruz Azul ERP',
    error: null,
    step3: true,
    isAdmin: true,
  });
});

router.post('/mfa/ssh-verify', isAuthenticated, mfaRateLimit, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/dashboard');
  }

  const { sshKey } = req.body;

  try {
    const sshValid = await MFAService.simulateSSHVerification(req.session.user.username);

    if (!sshValid) {
      return res.render('mfa-verify', {
        title: 'Verificación SSH - Cruz Azul ERP',
        error: 'Verificación SSH fallida. Verifique su clave SSH.',
        step3: true,
        isAdmin: true,
      });
    }

    req.session.sshVerified = true;
    req.session.fullAuth = true;

    const tokenJWT = generateToken({
      id: req.session.user.id,
      username: req.session.user.username,
      role: req.session.user.role,
      sshVerified: true,
    });
    req.session.token = tokenJWT;

    await dbService.logAuthAttempt(req.session.user.username, true, req.ip, 'MFA: Verificación SSH exitosa - Paso 3');

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Error en SSH verify:', err);
    res.render('mfa-verify', {
      title: 'Verificación SSH - Cruz Azul ERP',
      error: 'Error en la verificación SSH.',
      step3: true,
      isAdmin: true,
    });
  }
});

router.get('/mfa/setup', isAuthenticated, async (req, res) => {
  try {
    const secret = MFAService.generateTOTPSecret(req.session.user.username);
    const qrCodeUrl = await MFAService.generateQRCode(secret.otpauth_url);
    const backupCodes = MFAService.generateBackupCodes();

    await dbService.enableMFA(req.session.user.id, secret.base32);
    await dbService.saveBackupCodes(req.session.user.id, backupCodes);

    res.render('mfa-setup', {
      title: 'Configurar MFA - Cruz Azul ERP',
      qrCode: qrCodeUrl,
      secret: secret.base32,
      backupCodes,
    });
  } catch (err) {
    console.error('Error en MFA setup:', err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al configurar MFA.',
    });
  }
});

router.post('/mfa/setup/confirm', isAuthenticated, async (req, res) => {
  const { token } = req.body;
  const isValid = MFAService.verifyTOTP(token, req.session.user.username);

  if (isValid) {
    res.json({ success: true, message: 'MFA configurado correctamente.' });
  } else {
    res.status(400).json({ success: false, message: 'Código inválido. Intente nuevamente.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error al cerrar sesión:', err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
