require('dotenv').config();

const db = require('../src/db');

console.log('🌱 Seeding database...\n');

// Sample products
const products = [
  {
    name: 'Classic Logo Tee',
    description: 'Cotton t-shirt with channel logo on the front. Available in black.',
    price: 24.99,
    image_url: 'https://placehold.co/400x400/333/fff?text=Logo+Tee',
    stock: 50
  },
  {
    name: 'Snapback Cap',
    description: 'Adjustable snapback cap with embroidered logo.',
    price: 19.99,
    image_url: 'https://placehold.co/400x400/1a237e/fff?text=Cap',
    stock: 30
  },
  {
    name: 'Hoodie — Limited Edition',
    description: 'Premium heavyweight hoodie. Limited run, grab yours before they sell out!',
    price: 49.99,
    image_url: 'https://placehold.co/400x400/4a148c/fff?text=Hoodie',
    stock: 15
  },
  {
    name: 'Sticker Pack',
    description: 'Set of 5 vinyl stickers featuring channel memes and logos.',
    price: 7.99,
    image_url: 'https://placehold.co/400x400/e65100/fff?text=Stickers',
    stock: 100
  },
  {
    name: 'Mug — "Hello World"',
    description: 'Ceramic mug with the iconic catchphrase. Dishwasher safe.',
    price: 14.99,
    image_url: 'https://placehold.co/400x400/1b5e20/fff?text=Mug',
    stock: 40
  },
  {
    name: 'Phone Case',
    description: 'Slim-fit phone case with channel artwork. Available for iPhone and Samsung.',
    price: 16.99,
    image_url: 'https://placehold.co/400x400/b71c1c/fff?text=Phone+Case',
    stock: 25
  }
];

const insert = db.prepare(
  'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)'
);

const insertMany = db.transaction((items) => {
  for (const p of items) {
    insert.run(p.name, p.description, p.price, p.image_url, p.stock);
  }
});

insertMany(products);

console.log(`✅ Inserted ${products.length} products:\n`);
products.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} — $${p.price} (${p.stock} in stock)`);
});

console.log('\n🎉 Done! Start the server with: npm start');
