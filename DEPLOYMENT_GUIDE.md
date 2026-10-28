# SRU MentorHub — Complete Production Deployment & Hosting Guide

This guide outlines everything required to deploy **SRU MentorHub** to production, including pre-flight security hardening, environment configuration, step-by-step deployment tutorials, and post-launch verification.

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Host |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | **Vercel** or **Cloudflare Pages** (Global Edge CDN) |
| **Backend API** | Node.js, Express, Prisma ORM | **Render** or **Railway** (Container / Web Service) |
| **Database** | PostgreSQL (Relational DB) | **Supabase** (Managed AWS PostgreSQL with PgBouncer) |

---

## 🔒 Pre-Hosting Security & Readiness Checklist

Before publishing your application online, verify each of the following security safeguards:

### 1. Unique, High-Entropy `JWT_SECRET`
- **Why:** The backend refuses to start in `NODE_ENV=production` if the default developer secret is detected.
- **Action:** Generate a cryptographically secure 64-character secret in your terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Set this value as `JWT_SECRET` in your backend host settings.

### 2. Strict CORS & `CLIENT_URL` Configuration
- **Why:** The server's CORS policy blocks unapproved origins in production to prevent Cross-Site Scripting (XSS) and unauthorized API exploitation.
- **Action:** Set `CLIENT_URL` in your backend host environment variables to your exact frontend domain, e.g.:
  ```text
  CLIENT_URL=https://mentorhub.vercel.app
  ```
  *(Note: Must include `https://` and have no trailing slash).*

### 3. Frontend Production API Base URL (`VITE_API_URL`)
- **Why:** In development, Vite uses a local proxy (`/api`). In production, the static React bundle makes direct network calls to your deployed backend.
- **Action:** Set `VITE_API_URL` during your frontend build step in Vercel:
  ```text
  VITE_API_URL=https://mentorhub-api.onrender.com/api/v1
  ```

### 4. Database Connection Strings (Supabase Pooler & Direct)
- **Why:** Serverless and multi-instance Node.js apps can exhaust PostgreSQL connections rapidly.
- **Action:** Use Supabase's transaction pooler (port `6543` with `?pgbouncer=true`) for application traffic, and the direct session URL (port `5432`) for schema migrations:
  ```text
  DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
  DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
  ```

### 5. Administrator Password Safety
- **Why:** In production mode, `server.js` prohibits creating an administrator account with the default password `Password@123`.
- **Action:** If bootstrapping a fresh database, define `ADMIN_PASSWORD` with a strong password (minimum 12 characters). *(Note: If your existing database already contains the admin, this check passes automatically).*

### 6. Single Page Application (SPA) Client Routing Rewrites
- **Status:** ✅ **Configured**.
  - [`client/vercel.json`](file:///d:/mentorconnect/client/vercel.json) has been configured with `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`.
  - [`client/public/_redirects`](file:///d:/mentorconnect/client/public/_redirects) has been configured with `/* /index.html 200` for Netlify/Cloudflare.
  - Reloading any deep React Router route (e.g., `/mentor/mentees` or `/admin/batches`) will resolve cleanly without 404 errors.

### 7. Prisma Client Auto-Generation in Production
- **Status:** ✅ **Configured**.
  - `server/package.json` now includes `"postinstall": "prisma generate"` and `"build": "prisma generate"`.
  - When deployment platforms run `npm install`, Prisma Client is automatically compiled for the host OS.

---

## 🚀 Recommended Deployment Strategy (Vercel + Render)

This is the fastest, lowest-maintenance, and most reliable hosting setup.

### Step 1: Deploy Backend to Render (or Railway)

1. Sign up / Log in to [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`2303A52012/mentorhub`).
4. Configure the Web Service settings:
   - **Name:** `mentorhub-api` (or custom name)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` or `Starter`
5. In the **Environment Variables** section, add the following:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
   DIRECT_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=your_generated_random_64_char_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://your-frontend.vercel.app
   ADMIN_EMAIL=admin@sru.edu.in
   ADMIN_PASSWORD=YourStrongPassword2026!
   ```
   *(Note: You can update `CLIENT_URL` once your Vercel frontend domain is created).*
6. Click **Create Web Service**. Wait for the build and startup log:
   ```text
   🚀 PostgreSQL Connected successfully to aws-0-ap-southeast-1.pooler.supabase.com:6543
   Database ready with 543 users (Admin: admin@sru.edu.in).
   🚀 MentorHub Server Running on port 10000
   ```
7. Copy your backend URL (e.g. `https://mentorhub-api.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel

1. Sign up / Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`2303A52012/mentorhub`).
4. Configure the Project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Expand **Environment Variables** and add:
   ```env
   VITE_API_URL=https://mentorhub-api.onrender.com/api/v1
   ```
   *(Replace with your actual Render backend URL followed by `/api/v1`).*
6. Click **Deploy**.
7. Once deployed, Vercel will assign a production URL (e.g., `https://mentorhub.vercel.app`).
8. Return to Render and ensure the `CLIENT_URL` environment variable matches this exact Vercel URL.

---

## 🖥️ Alternative Option: Single VPS Deployment (Ubuntu / AWS EC2 / DigitalOcean)

If you prefer hosting both frontend and backend on a single virtual private server with a custom domain:

### 1. Server Prerequisites
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Clone & Build
```bash
git clone https://github.com/2303A52012/mentorhub.git /var/www/mentorhub
cd /var/www/mentorhub

# Build Backend
cd server
npm install
npm run build
cp .env.example .env
nano .env # Paste your production environment variables

# Start Backend via PM2
pm2 start src/server.js --name mentorhub-api
pm2 save
pm2 startup

# Build Frontend
cd ../client
npm install
echo "VITE_API_URL=/api/v1" > .env.production
npm run build
```

### 3. Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/mentorhub`:
```nginx
server {
    listen 80;
    server_name mentorhub.sru.edu.in; # Or your custom domain

    # Static React Frontend
    location / {
        root /var/www/mentorhub/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy to Express Backend
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and obtain a free Let's Encrypt SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/mentorhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d mentorhub.sru.edu.in
```

---

## 🧪 Post-Deployment Verification Checklist

Once hosted, test the live deployment using these checks:

1. **API Health Check Probe:**
   - Open in your browser: `https://<YOUR_BACKEND_URL>/api/health`
   - Expected response (HTTP 200):
     ```json
     {
       "status": "healthy",
       "database": "connected",
       "fingerprint": "aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres#...",
       "timestamp": "2026-10-28T..."
     }
     ```

2. **Security Headers Verification:**
   - Run in terminal:
     ```bash
     curl -I https://<YOUR_BACKEND_URL>/api/health
     ```
   - Verify presence of:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: SAMEORIGIN`
     - `Content-Security-Policy: ...`
     - Absence of `X-Powered-By` header.

3. **CORS Verification:**
   - Try to query the API from an unpermitted browser console origin. It should return HTTP 403 `CORS blocked: Origin ... is not permitted`.
   - From your deployed Vercel domain, all network requests should succeed with HTTP 200.

4. **Authentication & User Flow:**
   - Log in as Administrator: `admin@sru.edu.in` / `Password@123`
   - Log in as Mentor: `2303A52012` / `Password@123` (Verify 12 assigned mentees appear on Dashboard)
   - Log in as Mentee: `2403A51402` / `Password@123` (Verify tasks and weekly targets load)

5. **Client SPA Route Refresh:**
   - Navigate to `https://<YOUR_FRONTEND_URL>/mentor/mentees`
   - Press **F5 / Hard Refresh**.
   - The page must reload the Mentee Directory directly without a 404 Not Found error.

---

## 📁 Environment Variable Templates Reference

- **Backend Template:** [`server/.env.example`](file:///d:/mentorconnect/server/.env.example)
- **Frontend Template:** [`client/.env.example`](file:///d:/mentorconnect/client/.env.example)
