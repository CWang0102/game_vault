import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Validation rules
const gameStatusValues = ['completed', 'to_play', 'playing', 'given_up'];

const createGameValidation = [
  body('title').trim().notEmpty().withMessage('Game title is required'),
  body('status').optional().isIn(gameStatusValues).withMessage('Invalid status value'),
  body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional({ nullable: true }).isString(),
  body('cover_url').optional({ nullable: true }).isURL().withMessage('Invalid cover URL'),
];

const updateGameValidation = [
  param('id').isInt().withMessage('Invalid game ID'),
  body('title').optional().trim().notEmpty().withMessage('Game title cannot be empty'),
  body('status').optional().isIn(gameStatusValues).withMessage('Invalid status value'),
  body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional({ nullable: true }).isString(),
  body('cover_url').optional({ nullable: true }).isURL().withMessage('Invalid cover URL'),
];

const listValidation = [
  query('status').optional().isIn(gameStatusValues).withMessage('Invalid status filter'),
  query('search').optional().isString(),
];

// List games - only for current user
router.get('/', listValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const userId = req.user.id;
    const { status, search } = req.query;
    let queryStr = 'SELECT * FROM games WHERE user_id = ?';
    const params = [userId];
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
      queryStr += ' AND ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY created_at DESC';

    const games = db.prepare(queryStr).all(...params);
    res.json({ games });
  } catch (err) {
    next(err);
  }
});

// Create game
router.post('/', createGameValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const userId = req.user.id;
    const { title, status, rating, comment, cover_url } = req.body;

    const result = db.prepare(`
      INSERT INTO games (user_id, title, status, rating, comment, cover_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      title.trim(),
      status || 'to_play',
      rating || null,
      comment?.trim() || null,
      cover_url || null
    );

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ game });
  } catch (err) {
    next(err);
  }
});

// Update game - only owner can update
router.put('/:id', updateGameValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = getDb();
    const userId = req.user.id;
    const gameId = parseInt(req.params.id, 10);
    const { title, status, rating, comment, cover_url } = req.body;

    const existingGame = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(gameId, userId);
    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    db.prepare(`
      UPDATE games
      SET title = COALESCE(?, title),
          status = COALESCE(?, status),
          rating = COALESCE(?, rating),
          comment = COALESCE(?, comment),
          cover_url = COALESCE(?, cover_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title?.trim() || null,
      status || null,
      rating || null,
      comment?.trim() || null,
      cover_url !== undefined ? (cover_url || null) : null,
      gameId,
      userId
    );

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    res.json({ game });
  } catch (err) {
    next(err);
  }
});

// Delete game - only owner can delete
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const gameId = parseInt(req.params.id, 10);

    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const existingGame = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(gameId, userId);
    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    db.prepare('DELETE FROM games WHERE id = ? AND user_id = ?').run(gameId, userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
