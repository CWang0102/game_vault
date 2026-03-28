import { getDb, initDatabase } from '../db/database.js';
import { runMigrations } from '../db/migrate.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

async function promptPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write('Enter password for root user: ');
    rl._writeToOutput = () => {}; // suppress echo
    rl.question('', (answer) => {
      process.stdout.write('\n');
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

  await initDatabase();
  await runMigrations();
  const db = getDb();

  // Check if user exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (existingUser) {
    // Update role to root
    db.prepare('UPDATE users SET role = ?, status = ? WHERE id = ?').run('root', 'approved', existingUser.id);
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
    db.prepare('INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)').run(email, passwordHash, 'root', 'approved');
    console.log(`Created new root user: ${email}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
