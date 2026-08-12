const { Router } = require('express');
const db = require('../db');
const { telegramAuth, adminOnly } = require('../middleware/auth');
const { getStats } = require('../bot');
const autoSeed = require('../auto-seed');

const router = Router();

// All admin routes require auth + admin
router.use(telegramAuth, adminOnly);

// GET /api/admin/stats — store statistics
router.get('/stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

// GET /api/admin/deliveries — pending deliveries with full details
router.get('/deliveries', (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.shipping_address, o.total, o.created_at, o.tracking_number,
           u.first_name, u.username, u.telegram_id
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.status = 'pending'
    ORDER BY o.created_at ASC
  `).all();

  const getItems = db.prepare(`
    SELECT p.name, oi.quantity, oi.price_at_order
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `);

  const result = orders.map(order => ({
    ...order,
    items: getItems.all(order.id)
  }));

  res.json(result);
});

// POST /api/admin/reseed — clear products and re-seed defaults
router.post('/reseed', (req, res) => {
  db.prepare('DELETE FROM products').run();
  autoSeed();
  const products = db.prepare('SELECT id, name, price, stock FROM products ORDER BY id').all();
  res.json({ success: true, count: products.length, products });
});

module.exports = router;
