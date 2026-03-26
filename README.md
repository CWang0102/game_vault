# Game Vault

A personal game library tracker with a retro CRT arcade aesthetic. Track your gaming collection, mark games as completed, to-play, or given up, and rate them with a 1-5 star system.

## Development

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both the server and client.

### Run Development Servers

```bash
npm run dev
```

Starts both the backend (port 3001) and frontend (Vite dev server, typically port 5173). The Vite proxy forwards `/api` requests to the server.

### Run Individually

```bash
npm run server   # Backend only on port 3001
npm run client   # Frontend only (Vite)
```

## Production

### Build

```bash
npm run build
```

Compiles the React frontend into static assets in `client/dist/`.

### Run Production Server

```bash
npm run server
```

Serves the built frontend along with the API on port 3001.

## First-Time Setup

After starting the server for the first time, you need to create a root user manually in the database.

1. Open `server/database.sqlite` with a SQLite browser (e.g., [DB Browser for SQLite](https://sqlitebrowser.org/))
2. Run the following SQL:

```sql
INSERT INTO users (email, password_hash, role, status)
VALUES (
  'admin@example.com',
  '$2a$10$...',  -- bcrypt hash of your password
  'root',
  'approved'
);
```

Or use the command line:

```bash
sqlite3 server/database.sqlite
```

```sql
INSERT INTO users (email, password_hash, role, status)
VALUES ('admin@example.com', '$2a$10$...', 'root', 'approved');
```

To generate the bcrypt hash, you can use Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(h => console.log(h))"
```

The root user bypasses the approval requirement and can access all features immediately.

## Tech Stack

**Frontend:** React 18, Vite, React Router v6, CSS Modules, Lucide React
**Backend:** Express, sql.js (SQLite), JWT, bcryptjs
