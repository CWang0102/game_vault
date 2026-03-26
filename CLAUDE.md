# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Vault is a personal game library tracker with a retro CRT arcade aesthetic. It uses a monorepo structure with a React frontend and Express backend communicating via REST API.

## Commands

```bash
# Install all dependencies (root, server, and client)
npm run install:all

# Run both client and server in development
npm run dev

# Run server only (port 3001)
npm run server

# Run client only (Vite dev server)
npm run client

# Build client for production
npm run build
```

**Note:** Server runs on port 3001, client Vite dev server picks an available port (typically 5173). The Vite proxy is configured to forward `/api` requests to the server.

## Architecture

### Frontend (client/)
- **React 18** with Vite, React Router v6
- **CSS Modules** for component styling + global CSS variables
- **Lucide React** for icons
- `src/context/AuthContext.jsx` — auth state management (login, register, logout, token validation)
- `src/pages/` — Login, Register, Dashboard
- `src/components/` — GameCard, GameModal, StarRating, Toast

### Backend (server/)
- **Express** with ES modules (`"type": "module"`)
- **sql.js** — pure JavaScript SQLite (no native compilation needed)
- **JWT** (jsonwebtoken) for auth tokens (7-day expiry)
- **bcryptjs** for password hashing

### API Design

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | — | Create account |
| `/api/auth/login` | POST | — | Get JWT token |
| `/api/auth/me` | GET | Bearer | Validate token, get user |
| `/api/games` | GET | Bearer | List user's games (query: `?status`, `?search`) |
| `/api/games` | POST | Bearer | Add a game |
| `/api/games/:id` | PUT | Bearer | Update a game |
| `/api/games/:id` | DELETE | Bearer | Delete a game |

### Data Model

**users**: `id`, `email`, `password_hash`, `created_at`
**games**: `id`, `user_id`, `title`, `status` (completed/to_play/given_up), `rating` (1-5), `comment`, `created_at`, `updated_at`

Games are scoped to users via `user_id` foreign key with CASCADE delete.

### Authentication Flow

1. Token stored in **localStorage** on client (`localStorage.setItem('token', ...)`)
2. Client sends `Authorization: Bearer <token>` header on protected requests
3. Server `authenticateToken` middleware verifies JWT and attaches `req.user`
4. Auth routes use this middleware; games routes use `router.use(authenticateToken)`

### Database Location

SQLite database file: `server/database.sqlite` (created automatically on first server start)

### Key Files

- `server/db/database.js` — DB connection + table creation
- `server/middleware/auth.js` — `authenticateToken`, `generateToken`
- `client/src/App.jsx` — Route definitions with ProtectedRoute/PublicRoute wrappers
