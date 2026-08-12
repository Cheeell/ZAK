const { Router } = require('express');
const db = require('../db');
const { telegramAuth, adminOnly } = require('../middleware/auth');

const router = Router();

// All order routes require authentication
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

// POST /api/orders — create order from cart
router.post('/', (req, res) => {
  const userId = ensureUser(req.telegramUser);
  const { shipping_address } = req.body;

  if (!shipping_address || shipping_address.trim().length < 5) {
    return res.status(400).json({ error: 'Valid shipping address is required' });
  }

  // Get cart items
  const cartItems = db.prepare(`
    SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND p.active = 1
  `).all(userId);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Validate stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({
        error: `Not enough stock for "${item.name}" (requested: ${item.quantity}, available: ${item.stock})`
      });
    }
  }

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Create order in a transaction
  const createOrder = db.transaction(() => {
    // Insert order
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, shipping_address, total) VALUES (?, ?, ?)'
    ).run(userId, shipping_address.trim(), total);

    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (?, ?, ?, ?)'
    );

    // Decrease stock
    const updateStock = db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ?'
    );

    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    // Clear cart
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    return orderId;
  });

  try {
    const orderId = createOrder();

    // Return the created order with items
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare(`
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId);

    res.status(201).json({ ...order, items });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders — get user's orders (or all orders for admin)
router.get('/', (req, res) => {
  const userId = ensureUser(req.telegramUser);
  const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number);
  const isAdmin = adminIds.includes(req.telegramUser.id);

  let orders;
  if (isAdmin && req.query.all === '1') {
    // Admin: all orders with user info
    orders = db.prepare(`
      SELECT o.*, u.first_name, u.username, u.telegram_id
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 100
    `).all();
  } else if (isAdmin && req.query.status) {
    // Admin: filter by status
    orders = db.prepare(`
      SELECT o.*, u.first_name, u.username, u.telegram_id
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.status = ?
      ORDER BY o.created_at DESC
    `).all(req.query.status);
  } else {
    // Regular user: only their orders
    orders = db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
  }

  // Attach items to each order
  const getItems = db.prepare(`
    SELECT oi.*, p.name, p.image_url
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

// PATCH /api/orders/:id — admin: update order status
router.patch('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { status, tracking_number } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
  }

  // If cancelling, restore stock
  if (status === 'cancelled' && order.status !== 'cancelled') {
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(id);
    const restoreStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of items) {
      restoreStock.run(item.quantity, item.product_id);
    }
  }

  const shippedAt = status === 'shipped' ? new Date().toISOString() : order.shipped_at;

  db.prepare(`
    UPDATE orders SET
      status = COALESCE(?, status),
      tracking_number = COALESCE(?, tracking_number),
      shipped_at = ?
    WHERE id = ?
  `).run(status, tracking_number || order.tracking_number, shippedAt, id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;
