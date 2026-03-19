const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretarachiz');
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware;
