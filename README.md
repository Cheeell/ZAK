# ZAK — Telegram Merch Mini App

A Telegram bot + Mini App for selling YouTuber merch. Two modes: **Customer** (browse, cart, checkout) and **Admin** (manage products, view pending deliveries, order stats).

## Tech Stack

- **Backend**: Node.js + Express
- **Bot**: [grammY](https://grammy.dev/)
- **Database**: SQLite (via better-sqlite3)
- **Frontend**: Vue 3 (CDN) Telegram Mini App

## Setup

### 1. Create a Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token
4. Send `/newapp` to create a Mini App — set the URL to your deployed domain

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
- `BOT_TOKEN` — your bot token from BotFather
- `ADMIN_IDS` — your Telegram user ID (get it from [@userinfobot](https://t.me/userinfobot))
- `PORT` — server port (default: 3000)

### 3. Install & Seed

```bash
npm install
npm run seed    # adds sample products
```

### 4. Run

```bash
npm start       # production
npm run dev     # development (auto-restart)
```

The bot will start with long polling. Open your bot in Telegram and send `/start`.

## Deployment on Koyeb (Free, No Credit Card)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/ZAK.git
git push -u origin main
```

### 2. Deploy on Koyeb

1. Go to [koyeb.com](https://koyeb.com) and sign up (no credit card)
2. Click **Create App** → **GitHub** → select your repo
3. Choose **Dockerfile** as builder
4. Under **Environment variables**, add:

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | your bot token from BotFather |
| `ADMIN_IDS` | your Telegram user ID |
| `WEBAPP_URL` | `https://your-app-xxx.koyeb.app` (Koyeb gives you this) |
| `DB_PATH` | `/data/merch.db` |

5. Under **Volumes**, mount a persistent disk:
   - Mount path: `/data`
   - Size: 1 GB (free)

6. Click **Deploy**

### 3. Post-Deploy

After deploy, the Koyeb URL will be something like `https://your-app-xxx.koyeb.app`.

1. Copy that URL and update `WEBAPP_URL` in your Koyeb environment variables
2. In [@BotFather](https://t.me/BotFather), set the Mini App URL: `/newapp` → paste your Koyeb URL
3. Seed products via Koyeb's **Shell** tab or run locally against the remote DB

### Free Tier Limits
- 1 Nanode instance (shared vCPU, ~256MB RAM)
- Persistent disk included
- Sleeps after inactivity — use [Uptime Robot](https://uptimerobot.com) to ping every 4 min

## Mini App URL

For local testing, open in a browser:

```
http://localhost:3000/webapp
```

For Telegram, the Mini App requires HTTPS. Use ngrok for local testing:

```bash
ngrok http 3000
```

Then set `WEBAPP_URL` in `.env` to the ngrok URL.

## Project Structure

```
src/
├── index.js              # Express server + bot startup
├── bot.js                # grammY bot commands & callbacks
├── db.js                 # SQLite schema & connection
├── middleware/
│   └── auth.js           # Telegram initData validation
└── routes/
    ├── products.js       # Product CRUD
    ├── cart.js           # Cart management
    ├── orders.js         # Order creation & admin
    └── admin.js          # Stats & delivery queue

webapp/
├── index.html            # Mini App SPA
├── app.js                # Vue 3 app logic
└── styles.css            # Theme-aware styles

scripts/
└── seed.js               # Sample product seeder
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | — | List active products |
| GET | `/api/products/all` | Admin | List all products |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Deactivate product |
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart` | User | Add to cart |
| PATCH | `/api/cart/:id` | User | Update quantity |
| DELETE | `/api/cart/:id` | User | Remove from cart |
| POST | `/api/orders` | User | Place order |
| GET | `/api/orders` | User | My orders / all (admin) |
| PATCH | `/api/orders/:id` | Admin | Update order status |
| GET | `/api/admin/stats` | Admin | Store statistics |
| GET | `/api/admin/deliveries` | Admin | Pending deliveries |
