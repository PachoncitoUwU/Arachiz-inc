const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middlewares/authMiddleware');

// Mapa de modelos por juego
const MODELS = {
  snake:    'snakeScore',
  breakout: 'breakoutScore',
  flappy:   'flappyScore',
  tower:    'towerScore',
  reaction: 'reactionScore',
  memory:   'memoryScore',
  wordle:   'wordleScore',
};

// Para reaction y wordle, menor score = mejor
const LOWER_IS_BETTER = ['reaction', 'wordle'];

// GET /api/games/:game/leaderboard
router.get('/:game/leaderboard', async (req, res) => {
  const { game } = req.params;
  const model = MODELS[game];
  if (!model) return res.status(400).json({ error: 'Juego no válido' });

  try {
    const orderBy = LOWER_IS_BETTER.includes(game)
      ? { score: 'asc' }
      : { score: 'desc' };

    const scores = await prisma[model].findMany({
      orderBy,
      take: 10,
      include: { user: { select: { fullName: true, avatarUrl: true } } }
    });

    res.json({
      scores: scores.map(s => ({
        name:   s.user.fullName,
        avatar: s.user.avatarUrl || null,
        score:  s.score,
        date:   s.updatedAt.toLocaleDateString('es-CO'),
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/games/:game/score  — upsert, solo guarda si es mejor
router.post('/:game/score', authMiddleware, async (req, res) => {
  const { game } = req.params;
  const { score } = req.body;
  const model = MODELS[game];

  if (!model) return res.status(400).json({ error: 'Juego no válido' });
  if (score === undefined || score === null) return res.status(400).json({ error: 'Score requerido' });

  try {
    const existing = await prisma[model].findUnique({ where: { userId: req.user.id } });
    const isBetter = !existing || (
      LOWER_IS_BETTER.includes(game)
        ? score < existing.score
        : score > existing.score
    );

    if (isBetter) {
      await prisma[model].upsert({
        where:  { userId: req.user.id },
        update: { score },
        create: { userId: req.user.id, score },
      });
    }

    res.json({ saved: isBetter, best: isBetter ? score : existing.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
