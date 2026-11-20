# RENO DESIGN - FastAPI Backend API

Production-grade asynchronous Backend API built with **FastAPI**, **PostgreSQL** (via `SQLAlchemy 2.0` + `asyncpg`), and **Razorpay Gateway Integration**.

## 🚀 Features

- **High-Performance Async Architecture**: Built on FastAPI + Uvicorn + asyncpg.
- **Port 1002**: Configured for Cloudflare tunnel mapping (`api.renoart.in` ➡️ `localhost:1002`).
- **PostgreSQL Database**:
  - `users`: Authentication (bcrypt, JWT tokens), role & membership tiers (Normal / Premium VIP).
  - `products`: 3D architectural & CNC patterns catalog with instant licensing details.
  - `orders`: Razorpay order generation, coupon discounts, currency calculations.
  - `order_items`: Line items purchased.
  - `purchased_products`: Instant digital CAD files unlocking with unique license keys.
- **Razorpay Integration**:
  - Order creation with paise calculation.
  - Cryptographic HMAC-SHA256 signature verification.
  - Digital fulfillment upon payment verification.
- **Swagger Documentation**: Interactive OpenAPI UI at `/docs` and `/redoc`.

---

## 🛠️ Local / VPS Setup

### 1. Requirements
```bash
python3 -m venv venv
source venv/bin/activate # (On Windows: .\venv\Scripts\activate)
pip install -r requirements.txt
```

### 2. Environment Variables (.env)
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 1002 --reload
```

---

## 🌐 Production Deployment on VPS (PM2)

```bash
# 1. Install PostgreSQL on Ubuntu VPS
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 2. Setup Database & User
sudo -u postgres psql -c "CREATE USER reno_user WITH PASSWORD 'reno_secure_pass_123';"
sudo -u postgres psql -c "CREATE DATABASE renodesign_db OWNER reno_user;"

# 3. Setup Virtualenv & Dependencies
cd ~/Renoart/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Start via PM2
pm2 start "venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 1002" --name "reno-backend"
pm2 save
```
