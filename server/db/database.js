import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'database.sqlite');

let db = null;

export async function initDatabase() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('root', 'user')) DEFAULT 'user',
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
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
    );
  `);

  saveDatabase();
  return db;
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

export async function seedDefaultUser() {
  const email = 'root@localhost';
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('root', 10);
    db.prepare('INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)')
      .run(email, passwordHash, 'root', 'approved');
    saveDatabase();
    console.log('Created default root user: root@localhost / root');
  }
}

function statementToObjects(stmt) {
  const columns = stmt.getColumnNames();
  const results = [];
  while (stmt.step()) {
    const row = stmt.get();
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    results.push(obj);
  }
  stmt.free();
  return results;
}

export function getDb() {
  return {
    prepare(sql) {
      return {
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          return statementToObjects(stmt);
        },
        get(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const results = statementToObjects(stmt);
          return results[0] || null;
        },
        run(...params) {
          db.run(sql, params);
          const lastId = db.exec("SELECT last_insert_rowid()")[0]?.values[0][0];
          const changes = db.getRowsModified();
          saveDatabase();
          return { lastInsertRowid: lastId, changes };
        }
      };
    },
    exec(sql) {
      db.run(sql);
      saveDatabase();
    }
  };
}

export default { getDb, initDatabase, saveDatabase };
