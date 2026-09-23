# Installation & Deployment Guide

This guide covers everything needed to get Game Vault running locally, ship it to a production server, and keep it running after you make code changes. For a feature overview, API reference, and database schema, see the [main README](README.md).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Dev Server](#running-the-dev-server)
- [Production Build](#production-build)
- [Deploying to a Server](#deploying-to-a-server)
- [Applying Code Changes](#applying-code-changes)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have the following installed:

### Node.js (version 18 or higher)

Check if Node.js is already installed:
```bash
node --version
```

If the command returns `v18.x.x` or higher, you're good. If not, download and install Node.js from [nodejs.org](https://nodejs.org). The **LTS** version is recommended.

### npm (comes with Node.js)

Check if npm is installed:
```bash
npm --version
```

This should print a version number. npm is bundled with Node.js, so if Node.js is installed, npm will be too.

### Git

To clone the repository you'll need Git. Check if it's installed:
```bash
git --version
```

If not installed, download it from [git-scm.com](https://git-scm.com).

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/game-vault.git
cd game-vault
```

> Replace the URL with the actual repository URL.

### 2. Install All Dependencies

From the root of the project, run:

```bash
npm run install:all
```

This single command installs dependencies for all three parts of the project:
- The root workspace
- The backend server (`server/node_modules/`)
- The React frontend (`client/node_modules/`)

> This may take a minute or two. You should see npm output for each package install.

---

## Environment Setup

The backend server requires a `.env` file with configuration values. A template is provided.

### 1. Copy the Template

```bash
cp server/.env.example server/.env
```

### 2. Edit the File

Open `server/.env` in any text editor and fill in the values:

```env
# Port the backend server listens on
PORT=3001

# Set to "development" locally, "production" on a live server
NODE_ENV=development

# Secret key used to sign JWT tokens — REQUIRED in production (run `openssl rand -base64 32` to generate)
# A default dev secret is used automatically in development
JWT_SECRET=replace-this-with-a-long-random-secret-string

# Allowed frontend origins (comma-separated). Defaults work for local dev.
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# IGDB API credentials (required for game title autocomplete and cover art)
# Register at https://dev.twitch.tv/console and enable the IGDB product
IGDB_CLIENT_ID=your-twitch-client-id
IGDB_CLIENT_SECRET=your-twitch-client-secret
```

> **Important:** Never commit your `.env` file to Git. It's already in `.gitignore`.

---

## Running the Dev Server

### Start Both Servers (Recommended for Development)

```bash
npm run dev
```

This starts:
- **Backend** at `http://localhost:3001` (auto-restarts on file changes via `node --watch`)
- **Frontend** at `http://localhost:5173` (Vite dev server with hot module reload)

Open your browser and navigate to `http://localhost:5173`.

> **Development only:** A default root account is created automatically on first startup:
> - Email: `root@localhost`
> - Password: `root`

### Start Servers Individually

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

---

## Production Build

To serve the app as a single server (frontend + API on one port):

### 1. Build the Frontend

```bash
npm run build
```

This compiles the React app into static files saved in `client/dist/`.

### 2. Start the Production Server

```bash
npm start
```

The Express server now serves both the static frontend files and the API on port 3001. Visit `http://localhost:3001` in your browser.

---

## Deploying to a Server

### 1. Transfer Files to Your Server

```bash
scp -r game_vault user@your-server-ip:/home/user/game_vault
```

Alternatively, push the code to GitHub and `git clone` it on the server.

### 2. Install Dependencies

```bash
cd game_vault
npm run install:all
```

### 3. Configure Environment

Create the production `.env` file on your server:

```bash
cp server/.env.example server/.env
nano server/.env
```

Set the following values:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-very-secure-random-string-at-least-32-characters
CORS_ORIGINS=https://yourdomain.com
IGDB_CLIENT_ID=your-twitch-client-id
IGDB_CLIENT_SECRET=your-twitch-client-secret
```

To generate a secure `JWT_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Build the Frontend

```bash
npm run build
```

### 5. Run with PM2 (Process Manager)

PM2 keeps the server running in the background and restarts it if it crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start server/index.js --name game-vault

# Save the process list so it restarts on reboot
pm2 save
pm2 startup
```

### 6. Configure Nginx (Reverse Proxy)

If you're using Nginx to serve the app on port 80/443:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve frontend static files
    root /home/user/game_vault/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Express backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Reload Nginx after saving:
```bash
sudo nginx -t        # test config for errors
sudo systemctl reload nginx
```

### 7. Enable HTTPS with Let's Encrypt (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 8. Point Your Domain

In your domain registrar's DNS settings, add an **A record** pointing your domain to your server's IP address. DNS changes can take up to 24 hours to propagate.

### 9. Create the First Admin Account

After the server is running, create a root/admin user:

```bash
npm run setup:root -- --email=admin@yourdomain.com --password=your_secure_password
```

If the email already exists, its role is upgraded to `root`. Otherwise a new account is created.

---

## Applying Code Changes

### During Local Development

You don't need to restart anything manually in most cases:

- **Frontend** — Vite's dev server hot-reloads the browser automatically when you save a file in `client/src/`.
- **Backend** — `npm run server` / `npm run dev` runs the server with `node --watch`, which restarts the process automatically whenever a file under `server/` changes.
- **Database schema** — migrations in `server/db/migrate.js` run automatically every time the server starts, so a restart (which happens automatically, per above) is enough to pick up schema changes. No manual migration command is needed.

You only need to take a manual step when:
- **Dependencies changed** (`package.json` was edited, or you pulled changes that added a package) — re-run `npm run install:all`.
- **Environment variables changed** (`.env` was edited) — the server only reads `.env` on startup, so stop and restart it (`npm run dev` / `npm run server`) for the new values to take effect.

### On a Production Server

After pulling new code (`git pull`) or otherwise updating the files on the server:

```bash
cd game_vault
git pull                 # or re-transfer files, if not using git

# 1. Install any new/updated dependencies
npm run install:all

# 2. Rebuild the frontend (skip if only server code changed)
npm run build

# 3. Restart the server process so it picks up the new server code
pm2 restart game-vault
```

Notes:
- Database migrations run automatically on server startup, so `pm2 restart` is sufficient to apply schema changes — no separate migration step is required.
- If you changed `server/.env`, restart with `pm2 restart game-vault` for the new values to load.
- If you only changed frontend code (`client/src/`), you still need `npm run build` — production serves the pre-built static files in `client/dist/`, not live source.
- If you only changed backend code (`server/`), `npm run build` is unnecessary; just restart with PM2.
- Check the app came back up cleanly with `pm2 logs game-vault`.

---

## Troubleshooting

### "Cannot find module" error when starting the server

Make sure you ran `npm run install:all` from the project root before starting.

### Port 3001 is already in use

Another process is using the port. Either stop that process, or change the port in `server/.env`:
```env
PORT=3002
```

Then update `CORS_ORIGINS` and `vite.config.js` proxy target to match.

### Frontend shows a blank page or 404 errors

In development, make sure you're visiting `http://localhost:5173` (Vite), not `http://localhost:3001`. In production (after `npm run build` + `npm start`), visit `http://localhost:3001`.

### Changes to the `.env` file are not being picked up

Restart the server after editing `.env`. The file is only read on startup.

### The database file keeps getting reset

The database file at `server/database.sqlite` persists between runs. If data is disappearing, check that you're not accidentally deleting the file or running a script that resets it.

### My code changes aren't showing up after deploying

- Frontend changes require `npm run build` before they're visible in production (see [Applying Code Changes](#applying-code-changes)).
- Backend changes require a process restart (`pm2 restart game-vault`).
- If you use a reverse proxy or CDN caching static assets, you may also need to clear that cache.
