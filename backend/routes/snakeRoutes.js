const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/snake/leaderboard — top 10 Snake por ficha
router.get('/leaderboard', async (req, res) => {
  const { fichaId } = req.query;
  try {
    const where = fichaId ? { user: { fichasApr: { some: { id: fichaId } } } } : undefined;
    const scores = await prisma.snakeScore.findMany({
      where, orderBy: { score: 'desc' }, take: 10,
      include: { user: { select: { fullName: true, avatarUrl: true } } }
    });
    res.json({ scores: scores.map(s => ({
      name: s.user.fullName, avatar: s.user.avatarUrl || null,
      score: s.score, date: s.updatedAt.toLocaleDateString('es-CO'),
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/snake/score — guardar mejor score Snake
router.post('/score', authMiddleware, async (req, res) => {
  const { score } = req.body;
  if (!score || score <= 0) return res.status(400).json({ error: 'Score inválido' });
  try {
    const existing = await prisma.snakeScore.findUnique({ where: { userId: req.user.id } });
    if (!existing || score > existing.score) {
      await prisma.snakeScore.upsert({
        where: { userId: req.user.id }, update: { score }, create: { userId: req.user.id, score },
      });
    }
    res.json({ saved: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/snake/breakout/leaderboard — top 10 Breakout por ficha
router.get('/breakout/leaderboard', async (req, res) => {
  const { fichaId } = req.query;
  try {
    const where = fichaId ? { user: { fichasApr: { some: { id: fichaId } } } } : undefined;
    const scores = await prisma.breakoutScore.findMany({
      where, orderBy: { score: 'desc' }, take: 10,
      include: { user: { select: { fullName: true, avatarUrl: true } } }
    });
    res.json({ scores: scores.map(s => ({
      name: s.user.fullName, avatar: s.user.avatarUrl || null,
      score: s.score, date: s.updatedAt.toLocaleDateString('es-CO'),
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/snake/breakout/score — guardar mejor score Breakout
router.post('/breakout/score', authMiddleware, async (req, res) => {
  const { score } = req.body;
  if (!score || score <= 0) return res.status(400).json({ error: 'Score inválido' });
  try {
    const existing = await prisma.breakoutScore.findUnique({ where: { userId: req.user.id } });
    if (!existing || score > existing.score) {
      await prisma.breakoutScore.upsert({
        where: { userId: req.user.id }, update: { score }, create: { userId: req.user.id, score },
      });
    }
    res.json({ saved: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// GET /api/snake/flappy/leaderboard
router.get('/flappy/leaderboard', async (req, res) => {
  const { fichaId } = req.query;
  try {
    const where = fichaId ? { user: { fichasApr: { some: { id: fichaId } } } } : undefined;
    const scores = await prisma.flappyScore.findMany({
      where, orderBy: { score: 'desc' }, take: 10,
      include: { user: { select: { fullName: true, avatarUrl: true } } }
    });
    res.json({ scores: scores.map(s => ({
      name: s.user.fullName, avatar: s.user.avatarUrl || null,
      score: s.score, date: s.updatedAt.toLocaleDateString('es-CO'),
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/snake/flappy/score
router.post('/flappy/score', authMiddleware, async (req, res) => {
  const { score } = req.body;
  if (score === undefined || score < 0) return res.status(400).json({ error: 'Score inválido' });
  try {
    const existing = await prisma.flappyScore.findUnique({ where: { userId: req.user.id } });
    if (!existing || score > existing.score) {
      await prisma.flappyScore.upsert({
        where: { userId: req.user.id }, update: { score }, create: { userId: req.user.id, score },
      });
    }
    res.json({ saved: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
