require('dotenv').config();

const db = require('../src/db');

console.log('🌱 Seeding VK products...\n');

const products = [
  {
    name: 'Кружка-хамелеон "Случайный сюрприз"',
    description: 'Хотите кружечку, но не можете определиться с дизайном? Тогда это ваш выбор! Мы отправим вам кружку с одним из дизайнов, но не скажем, какой именно вам выпал, пока вы её не получите и не нальёте дома кипяточка! Удачи <3\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-43.vkuserphoto.ru/s/v1/ig2/WQecJ_izCcVgsFXGmqdMbt1MBRNy-V_9wqUTzMaExHnlPJ5sOLXKDiGo4gNsnMr2t2bGyXeSAftq47iFxonp73ma.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440,2000x2000&from=bu&u=s38t7EELr7gAibsLpLRPRyegoPlOI3PXfmbdam7wnME&cs=540x0',
    stock: 20
  },
  {
    name: 'Кружка-хамелеон "Сила"',
    description: 'В комплекте: чёрная кружка-хамелеон "Сила"!\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-74.vkuserphoto.ru/s/v1/ig2/fzstsRXV5kfOOoP2Js9feBmpRuNF_5OVOp8jGht7hjgl_EUPWMX21LGxyic82vLwcn4m-_z-R60pqQak-_XajnCI.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440,2000x2000&from=bu&u=yUzjuyhTaCprhrudt8OW6XLiX2Ax2-aZzCOzYoc1ef0&cs=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Регенерация"',
    description: 'В комплекте: чёрная кружка-хамелеон "Регенерация"!\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-53.vkuserphoto.ru/s/v1/ig2/EkOJ19ZG6OfeAhXZiMe-8v-6TiXCnDKt_CPdssfvJ1ZWk7QyosVR5M6-v4O6dqoRiL-NnvFBlt12u12bdEUk5iSq.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440,2000x2000&from=bu&u=iUk8sHYsQmBEh4tcyMUS6ujB2y9IkD6g_kq0raqxf_U&cs=540x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Отравление"',
    description: 'В комплекте: чёрная кружка-хамелеон "Отравление"\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-3.vkuserphoto.ru/s/v1/ig2/W04dzPheDqDRu9fUmDzvfI69L7u21YUky5nBljW7LUvHb3gv2gvD1FmdgqLCkniJwiqGpb2MhTC3mRW57HI6k4b2.jpg?quality=95&as=32x27,48x40,72x60,108x90,160x133,240x199,360x299,480x399,540x449,640x532,720x598,1080x897,1280x1063,1440x1196,1803x1498&from=bu&u=G4I0js7zisdA4NZh5zWKaJ1BHJnrxdPox019PjV2u4A&cs=640x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Починка"',
    description: 'В комплекте: чёрная кружка-хамелеон "Починка"\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-16.vkuserphoto.ru/s/v1/ig2/pYW7r7bD9gp8t0UcyPT8srAsIc-wFQsr0TA7th6KvpJQNLohcyaa5jyG5vnSKEZpjt0VuR9Dy-Osut-N2devpxn7.jpg?quality=95&as=32x27,48x40,72x60,108x90,160x133,240x199,360x299,480x399,540x449,640x532,720x598,1080x897,1280x1063,1440x1196,1803x1498&from=bu&u=j8NbzC4d1Z7Li6DxfNjLgwgYONFWoPv3cSShsfkwL-c&cs=640x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Острота"',
    description: 'В комплекте: чёрная кружка-хамелеон "Острота"\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-30.vkuserphoto.ru/s/v1/ig2/owytBr8bC0UtBTI7KLD0HaB5U6nA0VFuKQZdY4aU36X-g7TS72H_U9lp5ZOtaF3i9ZzI1qYOv1HazQT9DsyjVoUE.jpg?quality=95&as=32x27,48x40,72x60,108x90,160x133,240x199,360x299,480x399,540x449,640x532,720x598,1080x897,1280x1063,1440x1196,1803x1498&from=bu&u=TBmGvBVSWk6bf4J2JsE-lUPz0v_G-yZykHETa6vbKGg&cs=640x0',
    stock: 15
  },
  {
    name: 'Кружка-хамелеон "Удача"',
    description: 'В комплекте: чёрная матовая кружка-хамелеон "Удача"\n\nМатериал: Фаянс.\nИзначально кружка чёрная, но если налить горячую воду, начинается настоящая магия и зачарование проявляется :)\nНе мыть в посудомойке.',
    price: 800,
    image_url: 'https://sun9-43.vkuserphoto.ru/s/v1/ig2/EsQV-naIXk2LFAFI379JeX6rxcgLpjHA1fmdmH0VHYTv1GL_7xShHdCzpt8LnzSwwJAHhPzVbtLMi0nubCNGdgzj.jpg?quality=95&as=32x27,48x40,72x60,108x90,160x133,240x199,360x299,480x399,540x449,640x532,720x598,1080x897,1280x1063,1440x1196,1803x1498&from=bu&u=v_K4rL-OEsMjH4R0A787PYRO9RemJMOYk1yixvKYQFg&cs=640x0',
    stock: 10
  },
  {
    name: 'Худи "Sharpness & Tenderness" (КРАСНЫЙ)',
    description: 'Осторожно, этот Худи слишком мягкий и тёплый, можно утонуть в нежности и вы не сможете перестать его трогать!\n\nДоставка по России бесплатная.\nТаблица размеров в фотографиях.\n\nНадписи — символы зачарования из Minecraft.\n\nРазмеры в наличии: XS, 2XL',
    price: 4000,
    image_url: 'https://sun9-71.vkuserphoto.ru/s/v1/ig2/byjwU5-scz2Ii9373mq4d4jv7UobwnWVUxaGr1TOXmmmP-HJKJaxgUln8xQpxv6eU9HvDIibw43XroOhsdmHa4Ir.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440,2000x2000&from=bu&u=q71RMkg3UFZ_f9xX_sfNA3hOjtQY-KNKjBflAnTlV4Q&cs=540x0',
    stock: 5
  },
  {
    name: 'Худи "Sharpness & Tenderness" (ФИОЛЕТОВЫЙ)',
    description: 'Осторожно, этот Худи слишком мягкий и тёплый, можно утонуть в нежности и вы не сможете перестать его трогать!\n\nТаблица размеров в фотографиях.\n\nНадписи — символы зачарования из Minecraft.\n\nРазмеры в наличии: XS, S, M, 2XL',
    price: 4000,
    image_url: 'https://sun9-57.vkuserphoto.ru/s/v1/ig2/p8QKWixnOWZnMy14NaVpdG9eZ8FrorLNPLe4rxv3KuPFO0n67pHsyxlAUIsheiCFvhasaXfZhOoF--EVeu0wHBnB.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440,2000x2000&from=bu&u=_GKau2prT8kZoUjT55uWaXdlKIq8GvVJfDqnCJAZMo0&cs=540x0',
    stock: 5
  }
];

// Clear old sample products first
db.prepare('DELETE FROM products').run();
console.log('🗑  Cleared old products\n');

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
  console.log(`  ${i + 1}. ${p.name} — ${p.price}₽ (${p.stock} in stock)`);
});

console.log('\n🎉 Done!');
