const { Router } = require('express');
const db = require('../db');
const { telegramAuth } = require('../middleware/auth');

const router = Router();

// All cart routes require authentication
router.use(telegramAuth);

// Ensure user exists in DB, return their internal ID
function ensureUser(telegramUser) {
  db.prepare(`
    INSERT INTO users (telegram_id, username, first_name)
    VALUES (?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name
  `).run(telegramUser.id, telegramUser.username, telegramUser.first_name);

  return db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegramUser.id).id;
}

// GET /api/cart — get user's cart
router.get('/', (req, res) => {
  const userId = ensureUser(req.telegramUser);

  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.product_id,
           p.name, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND p.active = 1
    ORDER BY ci.id
  `).all(userId);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.json({ items, total });
});

// POST /api/cart — add item to cart (or update quantity)
router.post('/', (req, res) => {
  const userId = ensureUser(req.telegramUser);
  const { product_id, quantity } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }

  // Check product exists and is in stock
  const product = db.prepare(
    'SELECT id, stock, active FROM products WHERE id = ?'
  ).get(product_id);

  if (!product || !product.active) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const qty = Math.max(1, Math.min(quantity || 1, product.stock));

  db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET
      quantity = MIN(?, (SELECT stock FROM products WHERE id = ?))
  `).run(userId, product_id, qty, qty, product_id);

  // Return updated cart
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.product_id,
           p.name, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND p.active = 1
    ORDER BY ci.id
  `).all(userId);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total });
});

// PATCH /api/cart/:id — update quantity
router.patch('/:id', (req, res) => {
  const userId = ensureUser(req.telegramUser);
  const { quantity } = req.body;
  const { id } = req.params;

  if (quantity == null || quantity < 1) {
    return res.status(400).json({ error: 'quantity must be >= 1' });
  }

  const item = db.prepare(
    'SELECT * FROM cart_items WHERE id = ? AND user_id = ?'
  ).get(id, userId);

  if (!item) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  // Cap at stock
  const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
  const qty = Math.min(quantity, product.stock);

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, id);

  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.product_id,
           p.name, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND p.active = 1
    ORDER BY ci.id
  `).all(userId);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total });
});

// DELETE /api/cart/:id — remove item from cart
router.delete('/:id', (req, res) => {
  const userId = ensureUser(req.telegramUser);
  const { id } = req.params;

  const result = db.prepare(
    'DELETE FROM cart_items WHERE id = ? AND user_id = ?'
  ).run(id, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.product_id,
           p.name, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND p.active = 1
    ORDER BY ci.id
  `).all(userId);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total });
});

// DELETE /api/cart — clear entire cart
router.delete('/', (req, res) => {
  const userId = ensureUser(req.telegramUser);
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  res.json({ items: [], total: 0 });
});

module.exports = router;
