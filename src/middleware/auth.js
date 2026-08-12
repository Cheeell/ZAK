const crypto = require('crypto');

/**
 * Validate Telegram WebApp initData using HMAC-SHA256
 * @param {string} initData - Raw initData string from Telegram.WebApp.initData
 * @param {string} botToken - Bot token for HMAC verification
 * @returns {object|null} Parsed user data or null if invalid
 */
function validateInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  // Remove hash from params for verification
  params.delete('hash');

  // Sort params alphabetically and build check string
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const checkString = sorted.map(([k, v]) => `${k}=${v}`).join('\n');

  // Compute HMAC
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (computedHash !== hash) return null;

  // Parse user data
  const userJson = params.get('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Express middleware: validates Telegram WebApp initData and attaches user to req
 * Expects header: X-Telegram-Init-Data
 */
function telegramAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  const botToken = process.env.BOT_TOKEN;

  const user = validateInitData(initData, botToken);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: invalid Telegram data' });
  }

  req.telegramUser = user;
  next();
}

/**
 * Express middleware: checks if the Telegram user is an admin
 * Must be used after telegramAuth
 */
function adminOnly(req, res, next) {
  const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
  if (!adminIds.includes(req.telegramUser.id)) {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }
  next();
}

module.exports = { validateInitData, telegramAuth, adminOnly };
