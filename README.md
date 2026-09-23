# Game Vault

A personal game library tracker with a retro CRT arcade aesthetic. Track your gaming collection, mark games as completed, to-play, playing, or given up, rate them with a 1-5 star system, and browse cover art pulled directly from IGDB.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Deployment](#installation--deployment)
- [Using the App](#using-the-app)
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

## Installation & Deployment

For prerequisites, installing dependencies, configuring `.env`, starting the dev server, building for production, deploying to a server, and what to do after pulling or making code changes, see **[INSTALLATION.md](INSTALLATION.md)**.

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

> For install, dev-server, and deployment issues (missing modules, port conflicts, `.env` not loading, etc.), see the [Troubleshooting section in INSTALLATION.md](INSTALLATION.md#troubleshooting).

### Login fails with "Invalid credentials"

- Double-check your email and password.
- If you forgot your password, there is no password reset feature — you would need to delete the user from the database and re-register.

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
