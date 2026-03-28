import request from 'supertest';
import express from 'express';
import gamesRoutes from '../routes/games.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/games', gamesRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const generateTestToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, email: 'test@example.com', role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
};

describe('Games Routes', () => {
  let authToken;

  beforeAll(() => {
    authToken = generateTestToken(999);
  });

  describe('GET /api/games', () => {
    it('should return 401 without authorization header', async () => {
      const res = await request(app).get('/api/games');
      expect(res.status).toBe(401);
    });

    it('should return 401 or 403 with invalid token format', async () => {
      const res = await request(app)
        .get('/api/games')
        .set('Authorization', 'Invalid token');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/games', () => {
    it('should return 401 without authorization', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({ title: 'Test Game' });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/games/:id', () => {
    it('should return 401 without authorization', async () => {
      const res = await request(app)
        .put('/api/games/1')
        .send({ title: 'Updated Game' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/games/:id', () => {
    it('should return 401 without authorization', async () => {
      const res = await request(app).delete('/api/games/1');
      expect(res.status).toBe(401);
    });
  });
});
