import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { getDb } from '../db/database.js';
import { authenticateToken, requireRoot } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRoot);

// Validation
const roleValidation = [
  body('role').isIn(['root', 'user']).withMessage('Invalid role. Must be "root" or "user"'),
];

const statusValidation = [
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid status. Must be "approved" or "rejected"'),
];

const userIdValidation = [
  param('id').isInt().withMessage('Invalid user ID'),
];

// List users
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, email, role, status, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// Update user role
router.put('/:id/role', [...userIdValidation, ...roleValidation], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const { id } = req.params;
    const { role } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    if (user.email === 'root@localhost') {
      return res.status(403).json({ error: 'The root@localhost account cannot be modified' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    const updated = db.prepare('SELECT id, email, role, status, created_at FROM users WHERE id = ?').get(id);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

// Update user status (approve / reject)
router.put('/:id/status', [...userIdValidation, ...statusValidation], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT id, email, role, status, created_at FROM users WHERE id = ?').get(id);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
