import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { getDb } from '../db/database.js';
import { authenticateToken, requireRoot } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Validation rules
const gameStatusValues = ['completed', 'to_play', 'given_up'];

const createGameValidation = [
  body('title').trim().notEmpty().withMessage('Game title is required'),
  body('status').optional().isIn(gameStatusValues).withMessage('Invalid status value'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString(),
];

const updateGameValidation = [
  param('id').isInt().withMessage('Invalid game ID'),
  body('title').optional().trim().notEmpty().withMessage('Game title cannot be empty'),
  body('status').optional().isIn(gameStatusValues).withMessage('Invalid status value'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString(),
];

const listValidation = [
  query('status').optional().isIn(gameStatusValues).withMessage('Invalid status filter'),
  query('search').optional().isString(),
];

// List games
router.get('/', listValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const { status, search } = req.query;
    let queryStr = 'SELECT * FROM games';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('title LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY created_at DESC';

    const games = db.prepare(queryStr).all(...params);
    res.json({ games });
  } catch (err) {
    next(err);
  }
});

// Create game
router.post('/', requireRoot, createGameValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const { title, status, rating, comment } = req.body;

    const result = db.prepare(`
      INSERT INTO games (title, status, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(
      title.trim(),
      status || 'to_play',
      rating || null,
      comment?.trim() || null
    );

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ game });
  } catch (err) {
    next(err);
  }
});

// Update game
router.put('/:id', requireRoot, updateGameValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const { id } = req.params;
    const { title, status, rating, comment } = req.body;

    const existingGame = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    db.prepare(`
      UPDATE games
      SET title = COALESCE(?, title),
          status = COALESCE(?, status),
          rating = COALESCE(?, rating),
          comment = COALESCE(?, comment),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title?.trim() || null,
      status || null,
      rating || null,
      comment?.trim() || null,
      id
    );

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
    res.json({ game });
  } catch (err) {
    next(err);
  }
});

// Delete game
router.delete('/:id', requireRoot, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const { id } = req.params;

    const existingGame = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    db.prepare('DELETE FROM games WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
