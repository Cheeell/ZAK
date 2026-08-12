const db = require('./db');

const PRODUCTS = [
  {
    name: 'Кружка-хамелеон "Случайный сюрприз"',
    description: 'Хотите кружечку, но не можете определиться с дизайном? Мы отправим вам кружку с одним из дизайнов, но не скажем, какой именно!\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-43.vkuserphoto.ru/s/v1/ig2/WQecJ_izCcVgsFXGmqdMbt1MBRNy-V_9wqUTzMaExHnlPJ5sOLXKDiGo4gNsnMr2t2bGyXeSAftq47iFxonp73ma.jpg?quality=95&as=540x0',
    stock: 20
  },
  {
    name: 'Кружка-хамелеон "Сила"',
    description: 'Чёрная кружка-хамелеон "Сила"!\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-74.vkuserphoto.ru/s/v1/ig2/fzstsRXV5kfOOoP2Js9feBmpRuNF_5OVOp8jGht7hjgl_EUPWMX21LGxyic82vLwcn4m-_z-R60pqQak-_XajnCI.jpg?quality=95&as=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Регенерация"',
    description: 'Чёрная кружка-хамелеон "Регенерация"!\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-53.vkuserphoto.ru/s/v1/ig2/EkOJ19ZG6OfeAhXZiMe-8v-6TiXCnDKt_CPdssfvJ1ZWk7QyosVR5M6-v4O6dqoRiL-NnvFBlt12u12bdEUk5iSq.jpg?quality=95&as=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Отравление"',
    description: 'Чёрная кружка-хамелеон "Отравление"\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-3.vkuserphoto.ru/s/v1/ig2/W04dzPheDqDRu9fUmDzvfI69L7u21YUky5nBljW7LUvHb3gv2gvD1FmdgqLCkniJwiqGpb2MhTC3mRW57HI6k4b2.jpg?quality=95&as=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Починка"',
    description: 'Чёрная кружка-хамелеон "Починка"\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-16.vkuserphoto.ru/s/v1/ig2/pYW7r7bD9gp8t0UcyPT8srAsIc-wFQsr0TA7th6KvpJQNLohcyaa5jyG5vnSKEZpjt0VuR9Dy-Osut-N2devpxn7.jpg?quality=95&as=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Острота"',
    description: 'Чёрная кружка-хамелеон "Острота"\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-30.vkuserphoto.ru/s/v1/ig2/owytBr8bC0UtBTI7KLD0HaB5U6nA0VFuKQZdY4aU36X-g7TS72H_U9lp5ZOtaF3i9ZzI1qYOv1HazQT9DsyjVoUE.jpg?quality=95&as=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Удача"',
    description: 'Чёрная матовая кружка-хамелеон "Удача"\n\nМатериал: Фаянс. Не мыть в посудомойке.\nИзначально чёрная, при наливании горячей воды проявляется зачарование :)',
    price: 800,
    image_url: 'https://sun9-43.vkuserphoto.ru/s/v1/ig2/EsQV-naIXk2LFAFI379JeX6rxcgLpjHA1fmdmH0VHYTv1GL_7xShHdCzpt8LnzSwwJAHhPzVbtLMi0nubCNGdgzj.jpg?quality=95&as=540x0',
    stock: 10
  },
  {
    name: 'Худи "Sharpness & Tenderness" (КРАСНЫЙ)',
    description: 'Мягкий и тёплый худи с символами зачарования из Minecraft.\n\nДоставка по России бесплатная. Таблица размеров в фотографиях.\nРазмеры в наличии: XS, 2XL',
    price: 4000,
    image_url: 'https://sun9-71.vkuserphoto.ru/s/v1/ig2/byjwU5-scz2Ii9373mq4d4jv7UobwnWVUxaGr1TOXmmmP-HJKJaxgUln8xQpxv6eU9HvDIibw43XroOhsdmHa4Ir.jpg?quality=95&as=540x0',
    stock: 5
  },
  {
    name: 'Худи "Sharpness & Tenderness" (ФИОЛЕТОВЫЙ)',
    description: 'Мягкий и тёплый худи с символами зачарования из Minecraft.\n\nТаблица размеров в фотографиях.\nРазмеры в наличии: XS, S, M, 2XL',
    price: 4000,
    image_url: 'https://sun9-57.vkuserphoto.ru/s/v1/ig2/p8QKWixnOWZnMy14NaVpdG9eZ8FrorLNPLe4rxv3KuPFO0n67pHsyxlAUIsheiCFvhasaXfZhOoF--EVeu0wHBnB.jpg?quality=95&as=540x0',
    stock: 5
  }
];

function autoSeed() {
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (count > 0) return; // Already has products, skip

  console.log('🌱 No products found — seeding defaults...');

  const insert = db.prepare(
    'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((items) => {
    for (const p of items) {
      insert.run(p.name, p.description, p.price, p.image_url, p.stock);
    }
  });

  insertMany(PRODUCTS);
  console.log(`✅ Seeded ${PRODUCTS.length} products`);
}

module.exports = autoSeed;
