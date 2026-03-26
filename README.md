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

## Deployment to VPS

### 1. Transfer Files to VPS

```bash
scp -r game_recorder user@your-vps:/path/to/game_vault
```

### 2. Install Dependencies

```bash
cd game_vault && npm install
```

### 3. Set Environment Variables

Create `server/.env`:

```env
JWT_SECRET=your-secure-random-string
PORT=3001
```

### 4. Configure Nginx

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

### 5. DNS Configuration

Point your domain's A record to your VPS IP address.

### 6. Enable SSL (Recommended)

```bash
sudo certbot --nginx -d yourdomain.com
```

### 7. Run with PM2

For process management and auto-restart:

```bash
npm install -g pm2
pm2 start server/index.js --name game-vault
pm2 save
pm2 startup
```

## First-Time Setup

After starting the server for the first time, create a root user to access the app:

```bash
# Interactive password prompt
npm run setup:root -- --email=admin@example.com

# Or supply password directly (useful for scripting)
npm run setup:root -- --email=admin@example.com --password=yourpassword
```

If the email already exists in the database, its role is upgraded to `root`. Otherwise a new root user is created with `approved` status.

The root user bypasses the approval requirement and can access all features immediately.

## Tech Stack

**Frontend:** React 18, Vite, React Router v6, CSS Modules, Lucide React
**Backend:** Express, sql.js (SQLite), JWT, bcryptjs
