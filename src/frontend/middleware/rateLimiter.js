const { RateLimiterMemory } = require('rate-limiter-flexible');

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 30,
});

const mfaLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 5,
  blockDuration: 60 * 15,
});

const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

async function loginRateLimit(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    await loginLimiter.consume(ip);
    next();
  } catch (err) {
    const retryAfter = Math.ceil(err.msBeforeNext / 1000) || 1800;
    res.status(429).json({
      error: `Demasiados intentos. Intente nuevamente en ${retryAfter} segundos.`,
      retryAfter,
    });
  }
}

async function mfaRateLimit(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    await mfaLimiter.consume(ip);
    next();
  } catch (err) {
    res.status(429).json({
      error: 'Demasiados intentos de MFA. Cuenta temporalmente bloqueada.',
      retryAfter: Math.ceil(err.msBeforeNext / 1000),
    });
  }
}

async function apiRateLimit(req, res, next) {
  try {
    const key = req.session?.user?.id || req.ip;
    await apiLimiter.consume(key);
    next();
  } catch (err) {
    res.status(429).json({ error: 'Límite de peticiones API excedido.' });
  }
}

module.exports = { loginRateLimit, mfaRateLimit, apiRateLimit };
