require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (runs schema on first require)
require('./db');

// Auto-seed products if database is empty
const autoSeed = require('./auto-seed');
autoSeed();

const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Mini App static files (both at root and /webapp)
const webappDir = path.join(__dirname, '..', 'webapp');
app.use(express.static(webappDir));
app.use('/webapp', express.static(webappDir));

// API routes
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bot setup (optional — server runs fine without it for API/frontend dev)
let bot = null;
if (process.env.BOT_TOKEN) {
  const { createBot } = require('./bot');
  const { webhookCallback } = require('grammy');

  bot = createBot();

  // Auto-detect: HTTPS WEBAPP_URL → webhook mode (production), else long polling (dev)
  const webAppUrl = process.env.WEBAPP_URL || '';
  const useWebhook = webAppUrl.startsWith('https://');

  if (useWebhook) {
    // Webhook mode (production) — no 409 conflicts on redeploy
    app.use('/webhook', webhookCallback(bot, 'express'));
    console.log(`🔗 Webhook mode — listening at /webhook`);

    bot.api.setWebhook(`${webAppUrl}/webhook`).then(() => {
      console.log(`✅ Webhook registered: ${webAppUrl}/webhook`);
    }).catch(err => {
      console.error('❌ Failed to set webhook:', err.message);
    });
  } else {
    // Long polling mode (development only)
    bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Bot @${botInfo.username} started (long polling)`);
      }
    }).catch(err => {
      console.error('❌ Failed to start bot:', err.message);
    });
  }
} else {
  console.log('⚠️  BOT_TOKEN not set — bot disabled, running API only');
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🛍 Mini App: http://localhost:${PORT}/webapp`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log('');
});

// Graceful shutdown
function shutdown() {
  console.log('\n👋 Shutting down...');
  if (bot) bot.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
