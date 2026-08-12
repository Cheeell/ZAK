const { Router } = require('express');
const db = require('../db');
const { telegramAuth, adminOnly } = require('../middleware/auth');

const router = Router();

// GET /api/products — public catalog
router.get('/', (req, res) => {
  const products = db.prepare(
    'SELECT id, name, description, price, image_url, stock FROM products WHERE active = 1 AND stock > 0 ORDER BY id'
  ).all();
  res.json(products);
});

// GET /api/products/all — admin: all products including inactive
router.get('/all', telegramAuth, adminOnly, (req, res) => {
  const products = db.prepare(
    'SELECT id, name, description, price, image_url, stock, active, created_at FROM products ORDER BY id'
  ).all();
  res.json(products);
});

// POST /api/products — admin: create product
router.post('/', telegramAuth, adminOnly, (req, res) => {
  const { name, description, price, image_url, stock } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price are required' });
  }

  const result = db.prepare(
    'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description || '', price, image_url || '', stock || 0);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id — admin: update product
router.put('/:id', telegramAuth, adminOnly, (req, res) => {
  const { name, description, price, image_url, stock, active } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      image_url = COALESCE(?, image_url),
      stock = COALESCE(?, stock),
      active = COALESCE(?, active)
    WHERE id = ?
  `).run(name, description, price, image_url, stock, active, id);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(product);
});

// DELETE /api/products/:id — admin: soft-delete (set inactive)
router.delete('/:id', telegramAuth, adminOnly, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ success: true });
});

module.exports = router;
