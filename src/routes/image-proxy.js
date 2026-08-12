const { Router } = require('express');
const https = require('https');

const router = Router();

// GET /api/image-proxy?url=<encoded-url>
// Proxies external images to bypass hotlink/CORS restrictions
router.get('/', (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('https://')) {
    return res.status(400).send('Missing or invalid url param');
  }

  const request = https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://vk.com/',
      'Accept': 'image/*'
    }
  }, (upstream) => {
    // Follow redirects
    if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
      https.get(upstream.headers.location, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://vk.com/' }
      }, (redirect) => {
        res.setHeader('Content-Type', redirect.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        redirect.pipe(res);
      }).on('error', () => res.status(502).end());
      return;
    }

    if (upstream.statusCode !== 200) {
      return res.status(upstream.statusCode).end();
    }

    res.setHeader('Content-Type', upstream.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    upstream.pipe(res);
  });

  request.on('error', () => res.status(502).send('Failed to fetch image'));
  request.setTimeout(10000, () => { request.destroy(); res.status(504).end(); });
});

module.exports = router;
