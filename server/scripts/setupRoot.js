import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'database.sqlite');

async function getDb() {
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    return new SQL.Database(buffer);
  }
  throw new Error('Database not found. Run the server first to create it.');
}

function saveDatabase(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
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

async function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter password for root user: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email = null;

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      email = arg.split('=')[1];
    }
  }

  if (!email) {
    console.error('Usage: node setupRoot.js --email=your@email.com [--password=password]');
    console.error('  If --password is not provided, you will be prompted for it.');
    process.exit(1);
  }

  email = email.toLowerCase().trim();

  const db = await getDb();

  // Check if user exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (existingUser) {
    // Update role to root
    db.run('UPDATE users SET role = ?, status = ? WHERE id = ?', ['root', 'approved', existingUser.id]);
    saveDatabase(db);
    console.log(`Updated user ${email} to root/admin role.`);
  } else {
    // Need password to create new user
    let password = null;
    for (const arg of args) {
      if (arg.startsWith('--password=')) {
        password = arg.split('=')[1];
      }
    }

    if (!password) {
      password = await promptPassword();
    }

    if (!password || password.length < 6) {
      console.error('Password must be at least 6 characters.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)', [email, passwordHash, 'root', 'approved']);
    saveDatabase(db);
    console.log(`Created new root user: ${email}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
