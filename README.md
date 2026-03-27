# Game Vault

A personal game library tracker with a retro CRT arcade aesthetic. Track your gaming collection, mark games as completed, to-play, playing, or given up, rate them with a 1-5 star system, and browse cover art pulled directly from IGDB.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the App](#running-the-app)
- [Using the App](#using-the-app)
- [Production Build](#production-build)
- [Deployment to Server](#deployment-to-server)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Game Tracking** — Add, edit, and delete games from your personal library
- **IGDB Autocomplete** — Live game title suggestions with cover art thumbnails as you type, powered by the IGDB database
- **Cover Art** — Game cover images are fetched from IGDB and displayed on each card in your library
- **Status Management** — Mark games as "Completed", "To Play", "Playing", or "Given Up"
- **Star Ratings** — Rate games on a 1-5 star scale
- **Comments** — Add personal notes and thoughts about each game
- **Search & Filter** — Find games by title or filter by status
- **Retro CRT Aesthetic** — Dark, moody interface with warm amber glow accents
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Secure Authentication** — JWT-based auth with bcrypt password hashing
- **Role-based Access** — Root admin can add/edit/delete games; regular users can browse the shared library

---

## Tech Stack

### Frontend
- React 18
- Vite (development server + build tool)
- React Router v6
- CSS Modules
- Lucide React (icons)

### Backend
- Express.js
- sql.js (pure JavaScript SQLite — no native dependencies to install)
- JWT (jsonwebtoken)
- bcryptjs
- CORS, Helmet, express-rate-limit
- IGDB API (via Twitch OAuth2 — server-side proxy)

---

## Project Structure

```
game_recorder/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── GameCard.jsx
│   │   │   ├── GameModal.jsx
│   │   │   ├── StarRating.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Admin.jsx
│   │   ├── context/           # React context (AuthContext)
│   │   ├── styles/            # Global CSS
│   │   └── App.jsx            # Main app with routing
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                    # Express backend
│   ├── db/
│   │   ├── database.js        # DB connection + schema
│   │   └── migrate.js         # Database migrations
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   ├── auth.js            # /api/auth/* routes
│   │   ├── games.js           # /api/games/* routes
│   │   ├── igdb.js            # /api/igdb/* routes (IGDB proxy)
│   │   └── users.js           # /api/users/* routes
│   ├── scripts/
│   │   └── setupRoot.js       # Root user setup script
│   ├── .env.example           # Environment variable template
│   ├── index.js               # Server entry point
│   └── package.json
├── package.json               # Root package.json with monorepo scripts
└── README.md
```

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

# Secret key used to sign JWT tokens — CHANGE THIS to a long random string
# Example: run `openssl rand -base64 32` in your terminal to generate one
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

## Running the App

### Start Both Servers (Recommended for Development)

```bash
npm run dev
```

This starts:
- **Backend** at `http://localhost:3001`
- **Frontend** at `http://localhost:5173` (Vite dev server)

Open your browser and navigate to `http://localhost:5173`.

### Start Servers Individually

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

---

## Using the App

### 1. Create an Account

On first load, you'll see the login page. Click **"Register"** to create a new account with your email and a password. New accounts are pending until approved by an admin.

### 2. Log In

After registering, log in with your credentials. You'll be redirected to your dashboard.

### 3. Add a Game (Admin only)

Click the **"+"** button on the dashboard. Fill in:
- **Title** — start typing and a dropdown appears with matching game titles and cover thumbnails from IGDB. Click a suggestion to auto-fill the title and attach the cover art, or type a custom title manually.
- **Status** — Completed / To Play / Playing / Given Up
- **Rating** — 1 to 5 stars (optional)
- **Comment** — personal notes (optional)

Once you select a game from the IGDB suggestions, its cover art is shown in the modal header and saved alongside the game.

### 4. Manage Your Library

- Hover over a game card and click the pencil icon to edit it
- Use the search bar to find a game by name
- Use the filter tabs to show only games with a specific status
- Click the status button on a card to cycle it to the next status
- Games with cover art display the cover image at the top of their card

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

## Deployment to Server

### 1. Transfer Files to Your Server

```bash
scp -r game_recorder user@your-server-ip:/home/user/game_vault
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

## API Reference

All game endpoints require a `Bearer` token in the `Authorization` header. Obtain a token by logging in via `/api/auth/login`.

### Authentication

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | No | Create a new account |
| `/api/auth/login` | POST | No | Log in and receive a JWT token |
| `/api/auth/me` | GET | Yes | Get the currently authenticated user |

#### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Response includes a `token` field — save this for subsequent requests.

#### Get Current User
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

### Games

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/games` | GET | Yes | List all games |
| `/api/games` | POST | Yes (root) | Add a new game |
| `/api/games/:id` | PUT | Yes (root) | Update an existing game |
| `/api/games/:id` | DELETE | Yes (root) | Delete a game |

### IGDB

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/igdb/search?q=<query>` | GET | Yes | Search for games; returns title and cover URL |

#### List Games (with optional filters)
```bash
# All games
curl http://localhost:3001/api/games \
  -H "Authorization: Bearer <your-token>"

# Filter by status: completed | to_play | playing | given_up
curl "http://localhost:3001/api/games?status=completed" \
  -H "Authorization: Bearer <your-token>"

# Search by title
curl "http://localhost:3001/api/games?search=zelda" \
  -H "Authorization: Bearer <your-token>"
```

#### Add a Game
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Legend of Zelda",
    "status": "completed",
    "rating": 5,
    "comment": "A masterpiece!",
    "cover_url": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg"
  }'
```

#### Update a Game
```bash
curl -X PUT http://localhost:3001/api/games/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "status": "completed"}'
```

#### Delete a Game
```bash
curl -X DELETE http://localhost:3001/api/games/1 \
  -H "Authorization: Bearer <your-token>"
```

---

## Database Schema

The SQLite database is created automatically at `server/database.sqlite` the first time the server starts. Migrations run on every startup to keep the schema up to date — no manual setup needed.

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('root', 'user')) DEFAULT 'user',
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Games Table
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('completed', 'to_play', 'playing', 'given_up')) DEFAULT 'to_play',
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  cover_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Games are shared across all users. Only users with the `root` role can add, edit, or delete entries.

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

### Login fails with "Invalid credentials"

- Double-check your email and password.
- If you forgot your password, there is no password reset feature — you would need to delete the user from the database and re-register.

### Changes to the `.env` file are not being picked up

Restart the server after editing `.env`. The file is only read on startup.

### The database file keeps getting reset

The database file at `server/database.sqlite` persists between runs. If data is disappearing, check that you're not accidentally deleting the file or running a script that resets it.

### Game title autocomplete isn't working

- Make sure `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` are set in `server/.env`.
- Verify the credentials are valid in the [Twitch Developer Console](https://dev.twitch.tv/console).
- The server must be restarted after updating `.env`.
- Autocomplete failures are silent — the title field still works for manual entry.

### Cover art is not showing

- Confirm IGDB credentials are configured (same requirement as autocomplete).
- Cover art is fetched from `images.igdb.com` — make sure the browser is not blocking external images.
- Games added before this feature was introduced will not have a cover. Edit and re-select the game from the IGDB dropdown to attach one.

---

## License

MIT License
