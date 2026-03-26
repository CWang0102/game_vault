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

  // 3. Handle games table - check if user_id column exists
  try {
    const tableInfo = db.prepare('PRAGMA table_info(games)').all();
    const hasUserId = tableInfo.some(col => col.name === 'user_id');

    if (hasUserId) {
      console.log('Migrating games table to shared collection...');

      // Create new games table without user_id
      db.prepare(`
        CREATE TABLE games_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          status TEXT CHECK(status IN ('completed', 'to_play', 'given_up')) DEFAULT 'to_play',
          rating INTEGER CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Copy data (user_id is not copied)
      db.prepare(`
        INSERT INTO games_new (title, status, rating, comment, created_at, updated_at)
        SELECT title, status, rating, comment, created_at, updated_at FROM games
      `).run();

      // Drop old table and rename
      db.prepare('DROP TABLE games').run();
      db.prepare('ALTER TABLE games_new RENAME TO games').run();

      console.log('Games table migrated successfully');
    }
  } catch (e) {
    console.error('Migration error (games table):', e.message);
  }

  saveDatabase();
  console.log('Migrations complete');
}
