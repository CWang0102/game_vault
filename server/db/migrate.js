import { getDb, saveDatabase } from './database.js';

export async function runMigrations() {
  const db = getDb();

  // 1. Add role column to users if not exists
  try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const hasRole = tableInfo.some(col => col.name === 'role');
    if (!hasRole) {
      db.prepare("ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('root', 'user')) DEFAULT 'user'").run();
      console.log('Added role column to users table');
    }
  } catch (e) {
    // Column may already exist in some DBs
  }

  // 2. Add status column to users if not exists
  try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const hasStatus = tableInfo.some(col => col.name === 'status');
    if (!hasStatus) {
      db.prepare("ALTER TABLE users ADD COLUMN status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending'").run();
      console.log('Added status column to users table');
    }
  } catch (e) {
    // Column may already exist in some DBs
  }

  // 3. Handle games table - add user_id if missing and add 'playing' status
  try {
    const tableInfo = db.prepare('PRAGMA table_info(games)').all();
    const hasUserId = tableInfo.some(col => col.name === 'user_id');
    const hasPlayingStatus = tableInfo.some(col => col.name === 'status');

    if (!hasUserId) {
      console.log('Migrating games table to add user_id column...');

      // Get root user id for migration
      const rootUser = db.prepare('SELECT id FROM users WHERE role = ?').get('root');

      // Clean up any leftover table from a previous failed migration
      db.prepare('DROP TABLE IF EXISTS games_new').run();

      // Create new games table with user_id
      db.prepare(`
        CREATE TABLE games_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          status TEXT CHECK(status IN ('completed', 'to_play', 'given_up', 'playing')) DEFAULT 'to_play',
          rating INTEGER CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          cover_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Copy data with user_id assigned to root user
      if (rootUser) {
        db.prepare(`
          INSERT INTO games_new (user_id, title, status, rating, comment, cover_url, created_at, updated_at)
          SELECT ?, title, status, rating, comment, cover_url, created_at, updated_at FROM games
        `).run(rootUser.id);
      }

      // Drop old table and rename
      db.prepare('DROP TABLE games').run();
      db.prepare('ALTER TABLE games_new RENAME TO games').run();

      console.log('Games table migrated successfully');
    }
  } catch (e) {
    console.error('Migration error (games table):', e.message);
  }

  // 4. Add cover_url column to games if not exists
  try {
    const tableInfo = db.prepare('PRAGMA table_info(games)').all();
    const hasCoverUrl = tableInfo.some(col => col.name === 'cover_url');
    if (!hasCoverUrl) {
      db.prepare('ALTER TABLE games ADD COLUMN cover_url TEXT').run();
      console.log('Added cover_url column to games table');
    }
  } catch (e) {
    console.error('Migration error (cover_url):', e.message);
  }

  // 5. Remove user_id column from games (all users now share a common game library)
  try {
    const tableInfo = db.prepare('PRAGMA table_info(games)').all();
    const hasUserId = tableInfo.some(col => col.name === 'user_id');
    if (hasUserId) {
      console.log('Migrating games table to remove user_id column...');

      // Create new games table without user_id
      db.prepare(`
        CREATE TABLE games_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          status TEXT CHECK(status IN ('completed', 'to_play', 'given_up', 'playing')) DEFAULT 'to_play',
          rating INTEGER CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          cover_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Copy data without user_id
      db.prepare(`
        INSERT INTO games_new (id, title, status, rating, comment, cover_url, created_at, updated_at)
        SELECT id, title, status, rating, comment, cover_url, created_at, updated_at FROM games
      `).run();

      // Drop old table and rename
      db.prepare('DROP TABLE games').run();
      db.prepare('ALTER TABLE games_new RENAME TO games').run();

      console.log('Games table migrated: user_id column removed');
    }
  } catch (e) {
    console.error('Migration error (remove user_id):', e.message);
  }

  saveDatabase();
  console.log('Migrations complete');
}
