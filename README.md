# Game Vault

A personal game library tracker with a retro CRT arcade aesthetic. Track your gaming collection, mark games as completed, to-play, or given up, and rate them with a 1-5 star system.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Production](#production)
- [First-Time Setup](#first-time-setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment to VPS](#deployment-to-vps)
- [License](#license)

## Features

- **Game Tracking**: Add, edit, and delete games from your personal library
- **Status Management**: Mark games as "Completed", "To Play", or "Given Up"
- **Star Ratings**: Rate games on a 1-5 star scale
- **Comments**: Add personal notes and thoughts about each game
- **Search & Filter**: Find games by title or filter by status
- **Retro CRT Aesthetic**: Dark, moody interface with warm amber glow accents
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

## Tech Stack

### Frontend
- React 18
- Vite
- React Router v6
- CSS Modules
- Lucide React (icons)

### Backend
- Express.js
- sql.js (pure JavaScript SQLite)
- JWT (jsonwebtoken)
- bcryptjs
- CORS, Helmet, express-rate-limit

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
│   │   └── users.js           # /api/users/* routes
│   ├── scripts/
│   │   └── setupRoot.js       # Root user setup script
│   ├── .env.example           # Environment template
│   ├── index.js               # Server entry point
│   └── package.json
├── package.json               # Root package.json
├── README.md
├── CLAUDE.md                  # Claude Code instructions
└── SPEC.md                    # Design specification
```

## Prerequisites

- Node.js 18 or higher
- npm

## Installation

### Clone the Repository

```bash
git clone <your-repo-url>
cd game_recorder
```

### Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for:
- Root package (if any)
- Server (`server/node_modules`)
- Client (`client/node_modules`)

## Development

### Run Both Servers

```bash
npm run dev
```

Starts:
- Backend server on port 3001 (with hot reload via `--watch`)
- Frontend Vite dev server on port 5173 (typically)

The Vite proxy is configured to forward `/api` requests to the backend server.

### Run Servers Individually

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

## Production

### Build the Frontend

```bash
npm run build
```

Compiles the React frontend into static assets in `client/dist/`.

### Run Production Server

```bash
npm start
```

Serves both the built frontend and API on port 3001.

## First-Time Setup

After starting the server for the first time, create a root user to access the app:

```bash
# Interactive password prompt
npm run setup:root -- --email=admin@example.com

# Or supply password directly (useful for scripting)
npm run setup:root -- --email=admin@example.com --password=yourpassword
```

If the email already exists in the database, its role is upgraded to `root`. Otherwise a new root user is created.

The root user has elevated privileges and can access all features immediately.

## API Documentation

### Authentication Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | — | Create a new account |
| `/api/auth/login` | POST | — | Login and get JWT token |
| `/api/auth/me` | GET | Bearer | Validate token, get current user |

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

#### Get Current User
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

### Game Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/games` | GET | Bearer | List user's games |
| `/api/games` | POST | Bearer | Add a new game |
| `/api/games/:id` | PUT | Bearer | Update a game |
| `/api/games/:id` | DELETE | Bearer | Delete a game |

#### List Games
```bash
# All games
curl http://localhost:3001/api/games \
  -H "Authorization: Bearer <your-token>"

# Filter by status
curl "http://localhost:3001/api/games?status=completed" \
  -H "Authorization: Bearer <your-token>"

# Search by title
curl "http://localhost:3001/api/games?search=zelda" \
  -H "Authorization: Bearer <your-token>"
```

#### Add Game
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "The Legend of Zelda", "status": "completed", "rating": 5, "comment": "A masterpiece!"}'
```

#### Update Game
```bash
curl -X PUT http://localhost:3001/api/games/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "status": "completed"}'
```

#### Delete Game
```bash
curl -X DELETE http://localhost:3001/api/games/1 \
  -H "Authorization: Bearer <your-token>"
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Games Table
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('completed', 'to_play', 'given_up')) DEFAULT 'to_play',
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Note**: Games are scoped to users via `user_id` foreign key. Deleting a user will cascade delete all their games.

The SQLite database file is located at `server/database.sqlite` (created automatically on first server start).

## Environment Variables

Create a `server/.env` file based on `server/.env.example`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (REQUIRED - use a secure random string in production)
JWT_SECRET=your-secure-secret-key-min-32-chars

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Deployment to VPS

### 1. Transfer Files to VPS

```bash
scp -r game_recorder user@your-vps:/path/to/game_vault
```

### 2. Install Dependencies

```bash
cd game_vault && npm run install:all
```

### 3. Configure Environment

Create `server/.env` on your VPS:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-very-secure-random-string-at-least-32-characters
CORS_ORIGINS=https://yourdomain.com
```

### 4. Build the Frontend

```bash
npm run build
```

### 5. Configure Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend static files
    root /path/to/game_vault/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to backend
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

### 6. DNS Configuration

Point your domain's A record to your VPS IP address.

### 7. Enable SSL (Recommended)

```bash
sudo certbot --nginx -d yourdomain.com
```

### 8. Run with PM2

For process management and auto-restart:

```bash
npm install -g pm2
pm2 start server/index.js --name game-vault
pm2 save
pm2 startup
```

### 9. First-Time Root User Setup

```bash
npm run setup:root -- --email=admin@yourdomain.com --password=your_secure_password
```

## License

MIT License
