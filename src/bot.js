const { Bot, InlineKeyboard } = require('grammy');
const db = require('./db');

let bot;

function createBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN is required');
  }

  bot = new Bot(token);

  // Global error handler
  bot.catch((err) => {
    console.error('Bot error:', err.message);
  });

  // Helpers
  function isHttps(url) {
    return url.startsWith('https://');
  }

  function getWebAppUrl(suffix = '') {
    return process.env.WEBAPP_URL
      ? `${process.env.WEBAPP_URL}${suffix}`
      : `http://localhost:${process.env.PORT || 3000}/webapp${suffix}`;
  }

  function storeReply(text) {
    const url = getWebAppUrl();
    const opts = { parse_mode: 'Markdown' };
    if (isHttps(url)) {
      opts.reply_markup = new InlineKeyboard().webApp('🛒 Open Store', url);
    } else {
      // No button for local URLs — append link as text
      text += `\n\n🔗 Open in browser: ${url}`;
    }
    return { text, opts };
  }

  function adminReply(text) {
    const url = getWebAppUrl('?admin=1');
    const kb = new InlineKeyboard()
      .text('📦 Pending Deliveries', 'admin_deliveries')
      .text('📊 Stats', 'admin_stats')
      .row()
      .text('🏷 Manage Products', 'admin_products');
    const opts = { parse_mode: 'Markdown' };
    if (isHttps(url)) {
      kb.row().webApp('🌐 Admin Panel', url);
      opts.reply_markup = kb;
    } else {
      opts.reply_markup = kb;
      text += `\n\n🔗 Admin panel: ${url}`;
    }
    return { text, opts };
  }

  // /start — Welcome + WebApp button
  bot.command('start', async (ctx) => {
    // Upsert user
    const user = ctx.from;
    db.prepare(`
      INSERT INTO users (telegram_id, username, first_name)
      VALUES (?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name
    `).run(user.id, user.username, user.first_name);

    const { text, opts } = storeReply(
      `🛍 *Welcome to the Merch Store!*\n\nBrowse our collection and grab some awesome merch.`
    );
    await ctx.reply(text, opts);
  });

  // /admin — Admin panel (only for admins)
  bot.command('admin', async (ctx) => {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
    if (!adminIds.includes(ctx.from.id)) {
      return ctx.reply('⛔ You are not an admin.');
    }

    const { text, opts } = adminReply('🔧 *Admin Panel*');
    await ctx.reply(text, opts);
  });

  // Callback: Pending deliveries list
  bot.callbackQuery('admin_deliveries', async (ctx) => {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
    if (!adminIds.includes(ctx.from.id)) {
      return ctx.answerCallbackQuery('Not authorized');
    }

    const orders = db.prepare(`
      SELECT o.id, o.shipping_address, o.total, o.created_at,
             u.first_name, u.username
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.status = 'pending'
      ORDER BY o.created_at ASC
      LIMIT 20
    `).all();

    if (orders.length === 0) {
      await ctx.answerCallbackQuery();
      return ctx.editMessageText('✅ No pending deliveries!', {
        reply_markup: new InlineKeyboard().text('« Back', 'admin_back')
      });
    }

    let text = '📦 *Pending Deliveries*\n\n';
    const keyboard = new InlineKeyboard();

    for (const order of orders) {
      const items = db.prepare(`
        SELECT p.name, oi.quantity
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
      `).all(order.id);

      const itemList = items.map(i => `${i.name} x${i.quantity}`).join(', ');
      const customerName = order.first_name || order.username || `ID:${order.id}`;

      text += `*#${order.id}* — ${customerName}\n`;
      text += `📍 ${order.shipping_address}\n`;
      text += `🛒 ${itemList}\n`;
      text += `💰 $${order.total.toFixed(2)}\n\n`;

      keyboard.text(`✅ Ship #${order.id}`, `ship_${order.id}`).row();
    }

    keyboard.text('« Back', 'admin_back');

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  });

  // Callback: Ship an order
  bot.callbackQuery(/^ship_(\d+)$/, async (ctx) => {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
    if (!adminIds.includes(ctx.from.id)) {
      return ctx.answerCallbackQuery('Not authorized');
    }

    const orderId = parseInt(ctx.match[1]);

    // Update order status
    db.prepare(`
      UPDATE orders SET status = 'shipped', shipped_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).run(orderId);

    // Notify the customer
    const order = db.prepare(`
      SELECT u.telegram_id FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
    `).get(orderId);

    if (order) {
      try {
        await bot.api.sendMessage(
          order.telegram_id,
          `✅ Your order *#${orderId}* has been shipped!`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('Failed to notify customer:', err.message);
      }
    }

    await ctx.answerCallbackQuery(`Order #${orderId} marked as shipped!`);

    // Refresh the deliveries list
    ctx.callbackQuery.data = 'admin_deliveries';
    // Re-trigger the deliveries handler inline
    const orders = db.prepare(`
      SELECT o.id, o.shipping_address, o.total, o.created_at,
             u.first_name, u.username
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.status = 'pending'
      ORDER BY o.created_at ASC
      LIMIT 20
    `).all();

    if (orders.length === 0) {
      return ctx.editMessageText('✅ All orders shipped!', {
        reply_markup: new InlineKeyboard().text('« Back', 'admin_back')
      });
    }

    let text = '📦 *Pending Deliveries*\n\n';
    const keyboard = new InlineKeyboard();
    for (const o of orders) {
      const items = db.prepare(`
        SELECT p.name, oi.quantity FROM order_items oi
        JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?
      `).all(o.id);
      const itemList = items.map(i => `${i.name} x${i.quantity}`).join(', ');
      const name = o.first_name || o.username || `ID:${o.id}`;
      text += `*#${o.id}* — ${name}\n📍 ${o.shipping_address}\n🛒 ${itemList}\n💰 $${o.total.toFixed(2)}\n\n`;
      keyboard.text(`✅ Ship #${o.id}`, `ship_${o.id}`).row();
    }
    keyboard.text('« Back', 'admin_back');

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  });

  // Callback: Stats
  bot.callbackQuery('admin_stats', async (ctx) => {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
    if (!adminIds.includes(ctx.from.id)) {
      return ctx.answerCallbackQuery('Not authorized');
    }

    const stats = getStats();

    const text = `📊 *Store Statistics*

💰 Total Revenue: $${stats.totalRevenue.toFixed(2)}
📦 Total Orders: ${stats.totalOrders}
⏳ Pending: ${stats.pendingOrders}
🚚 Shipped: ${stats.shippedOrders}
✅ Delivered: ${stats.deliveredOrders}

🏆 *Top Products:*
${stats.topProducts.map((p, i) => `${i + 1}. ${p.name} — ${p.count} sold`).join('\n') || 'No orders yet'}`;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('« Back', 'admin_back')
    });
  });

  // Callback: Manage Products
  bot.callbackQuery('admin_products', async (ctx) => {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
    if (!adminIds.includes(ctx.from.id)) {
      return ctx.answerCallbackQuery('Not authorized');
    }

    const products = db.prepare('SELECT id, name, price, stock, active FROM products ORDER BY id').all();

    if (products.length === 0) {
      await ctx.answerCallbackQuery();
      return ctx.editMessageText('🏷 No products yet. Add them via the Admin Panel webapp.', {
        reply_markup: new InlineKeyboard().text('« Back', 'admin_back')
      });
    }

    let text = '🏷 *Products*\n\n';
    for (const p of products) {
      const status = p.active ? (p.stock > 0 ? '🟢' : '🟡') : '🔴';
      text += `${status} *#${p.id}* ${p.name} — $${p.price.toFixed(2)} (${p.stock} in stock)\n`;
    }
    text += '\n🟢 Active | 🟡 Out of stock | 🔴 Inactive';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('« Back', 'admin_back')
    });
  });

  // Callback: Back to admin menu
  bot.callbackQuery('admin_back', async (ctx) => {
    const { text, opts } = adminReply('🔧 *Admin Panel*');
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, opts);
  });

  return bot;
}

function getStats() {
  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE status != 'cancelled'
  `).get().sum;

  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  const pendingOrders = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
  ).get().count;

  const shippedOrders = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'"
  ).get().count;

  const deliveredOrders = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'"
  ).get().count;

  const topProducts = db.prepare(`
    SELECT p.name, SUM(oi.quantity) as count
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY count DESC
    LIMIT 5
  `).all();

  return { totalRevenue, totalOrders, pendingOrders, shippedOrders, deliveredOrders, topProducts };
}

module.exports = { createBot, getStats };
