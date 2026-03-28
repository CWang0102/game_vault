import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db/database.js';
import { generateToken, authenticateToken, tokenOptions } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').custom((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value === 'root@localhost' || emailRegex.test(value)) return true;
    throw new Error('Valid email is required');
  }).normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').custom((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value === 'root@localhost' || emailRegex.test(value)) return true;
    throw new Error('Valid email is required');
  }).normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const db = getDb();

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, 'user', 'pending');

    res.status(201).json({
      user: { id: result.lastInsertRowid, email, role: 'user', status: 'pending' },
      message: 'Registration submitted. Please wait for admin approval.',
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.role !== 'root' && user.status !== 'approved') {
      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Account pending approval' });
      }
      return res.status(403).json({ error: 'Account rejected' });
    }

    const token = generateToken(user);

    // Set httpOnly cookie
    res.cookie('token', token, tokenOptions());

    res.json({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    next(err);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

// Get current user
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
