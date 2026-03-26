# Game Vault — Personal Game Library

## Concept & Vision

A personal game tracking sanctuary that feels like stepping into a retro arcade cabinet reimagined for the modern era. Dark, moody atmosphere with warm amber CRT-glow accents and subtle scanline textures. The interface should feel like a treasured artifact — part gaming nostalgia, part refined editorial design. Every interaction has weight and response, making cataloging your games feel like curating a collection, not filling a spreadsheet.

## Design Language

### Aesthetic Direction
**Retro CRT Arcade meets Editorial Magazine** — Deep charcoal backgrounds with warm amber/gold phosphor-glow accents. Subtle scanline overlay and CRT curvature effects on key elements. Typography is bold and confident with a display font that evokes arcade cabinets, paired with a refined serif for readability.

### Color Palette
```css
--bg-deep: #0d0d0f;
--bg-surface: #161619;
--bg-elevated: #1e1e22;
--bg-hover: #252529;
--amber-glow: #f5a623;
--amber-dim: #c4841d;
--amber-bright: #ffc107;
--text-primary: #e8e6e3;
--text-secondary: #8a8a8d;
--text-muted: #5a5a5d;
--success: #4ade80;
--danger: #f87171;
--info: #60a5fa;
```

### Typography
- **Display/Headings**: "Press Start 2P" (pixel font for arcade authenticity) — used sparingly for titles and category labels
- **Body**: "Crimson Pro" (elegant serif) — for game titles, descriptions, comments
- **UI Elements**: "JetBrains Mono" — for ratings, stats, metadata

### Spatial System
- Base unit: 8px
- Generous padding on cards (24-32px)
- Asymmetric layouts — game cards have slight rotation variance for organic feel
- Section headers break the grid with oversized typography

### Motion Philosophy
- **Page load**: Staggered fade-up reveals (100ms delay between items)
- **Card interactions**: Subtle scale (1.02) + shadow lift on hover, 200ms ease-out
- **Category tabs**: Sliding underline indicator with glow effect
- **Adding/editing**: Modal slides up with backdrop blur
- **Status changes**: Color pulse animation on the status badge

### Visual Assets
- **Icons**: Lucide icons with 1.5px stroke weight
- **Decorative**: Subtle scanline CSS overlay, corner brackets on cards, dot-grid patterns
- **Empty states**: Custom illustrated SVG of an arcade cabinet

## Layout & Structure

### Page Architecture
1. **Header Bar** — App title "GAME VAULT" in pixel font, user avatar/login button, subtle bottom border glow
2. **Category Navigation** — Horizontal tabs: "ALL | COMPLETED | TO PLAY | GIVEN UP" with animated underline indicator
3. **Stats Bar** — Quick counts: total games, completion rate, average rating — displayed as monospace counters
4. **Game Grid** — Masonry-inspired grid with varied card sizes based on rating (higher rated = larger)
5. **Floating Action** — "+" button to add new game, fixed bottom-right with glow effect
6. **Footer** — Minimal: "Your collection, your rules"

### Responsive Strategy
- Desktop: 3-4 column grid
- Tablet: 2 column grid
- Mobile: Single column, collapsible categories

## Features & Interactions

### Authentication
- **Login/Register modal** with email + password
- JWT-based auth with httpOnly refresh token
- Persistent session across browser refreshes
- Logout clears all tokens

### Game Management
- **Add Game**: Modal form with title, status (dropdown), rating (1-5 stars), comment (textarea)
- **Edit Game**: Click card to open edit modal, same fields
- **Delete Game**: Trash icon with confirmation dialog
- **Status Change**: Quick-action buttons on card to change status without opening edit

### Game Card Display
- Game title (serif, large)
- Status badge (color-coded: green=completed, amber=to play, red=given up)
- Star rating display (filled/empty stars)
- Comment preview (truncated to 2 lines, expandable)
- Date added in muted text
- Hover: reveals quick-action buttons

### Filtering & Search
- Category tabs for quick filter
- Search bar filters by title in real-time
- Empty state with SVG illustration when no results

### Error Handling
- Form validation with inline error messages
- Toast notifications for success/error feedback
- Network error shows retry option

## Component Inventory

### LoginModal
- **Default**: Dark modal with amber border glow, email/password inputs, submit button
- **Loading**: Button shows spinner, inputs disabled
- **Error**: Shake animation, red border on invalid fields, error message below form

### GameCard
- **Default**: Elevated surface with subtle border, rotated -0.5deg to +0.5deg randomly
- **Hover**: Scale 1.02, shadow increases, quick-action buttons fade in
- **Status indicators**: Colored left border (4px) matching status

### StarRating
- **Display mode**: Filled amber stars, empty stars as outlines
- **Input mode**: Hover preview, click to set, interactive cursor

### CategoryTab
- **Default**: Muted text
- **Active**: Amber text with glowing underline indicator
- **Hover**: Text brightens

### AddGameModal
- **Fields**: Title (required), Status (select), Rating (star input), Comment (textarea)
- **Submit**: Amber button with loading state
- **Cancel**: Ghost button, closes modal

### Toast Notification
- **Success**: Green left border, checkmark icon
- **Error**: Red left border, X icon
- **Animation**: Slide in from right, auto-dismiss after 3s

## Technical Approach

### Stack
- **Frontend**: React 18 with Vite, React Router for auth routes
- **Backend**: Node.js + Express
- **Database**: SQLite with sql.js (pure JavaScript, no native compilation)
- **Auth**: JWT with bcrypt for password hashing
- **Styling**: CSS Modules with CSS variables

### Project Structure
```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── styles/
│   └── index.html
├── server/                # Express backend
│   ├── db/
│   ├── routes/
│   ├── middleware/
│   └── index.js
├── database.sqlite
└── SPEC.md
```

### API Design

#### Auth Endpoints
```
POST /api/auth/register
  Body: { email, password }
  Response: { user: { id, email }, token }

POST /api/auth/login
  Body: { email, password }
  Response: { user: { id, email }, token }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { user: { id, email } }
```

#### Game Endpoints
```
GET /api/games
  Headers: Authorization: Bearer <token>
  Query: ?status=completed|to_play|given_up&search=term
  Response: { games: [...] }

POST /api/games
  Headers: Authorization: Bearer <token>
  Body: { title, status, rating, comment }
  Response: { game: {...} }

PUT /api/games/:id
  Headers: Authorization: Bearer <token>
  Body: { title?, status?, rating?, comment? }
  Response: { game: {...} }

DELETE /api/games/:id
  Headers: Authorization: Bearer <token>
  Response: { success: true }
```

### Data Model

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Games Table
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

### Authentication Strategy
- Registration: Hash password with bcrypt, create user, return JWT
- Login: Verify password, return JWT
- Protected routes: Validate JWT, attach user to request
- Token stored in localStorage for API calls
