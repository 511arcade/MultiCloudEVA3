const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

const userSecrets = new Map();

class MFAService {
  static generateTOTPSecret(username) {
    const secret = speakeasy.generateSecret({
      name: `${process.env.MFA_ISSUER || 'CruzAzul-ERP'}:${username}`,
      length: 20,
    });

    userSecrets.set(username, {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    });

    return secret;
  }

  static async generateQRCode(otpauthUrl) {
    try {
      return await qrcode.toDataURL(otpauthUrl);
    } catch (err) {
      console.error('Error generando QR:', err);
      throw err;
    }
  }

  static verifyTOTP(token, username) {
    const userData = userSecrets.get(username);
    if (!userData) return false;

    return speakeasy.totp.verify({
      secret: userData.secret,
      encoding: 'base32',
      token: token,
      window: 1,
    });
  }

  static generateEmailOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  static verifyEmailOTP(otp, storedOtp) {
    if (!otp || !storedOtp) return false;
    return otp === storedOtp;
  }

  static generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  static verifyBackupCode(code, userBackupCodes) {
    if (!code || !userBackupCodes) return false;
    const index = userBackupCodes.indexOf(code.toUpperCase());
    if (index !== -1) {
      userBackupCodes.splice(index, 1);
      return true;
    }
    return false;
  }

  static generateSessionToken(userData) {
    const token = crypto.randomBytes(32).toString('hex');
    return token;
  }

  static async simulateSSHVerification(username) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[SSH MFA] Verificación SSH completada para ${username}`);
        resolve(true);
      }, 2000);
    });
  }
}

module.exports = MFAService;
