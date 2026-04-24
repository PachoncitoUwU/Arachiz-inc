const roleMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Acceso denegado. Rol no autorizado.' });
    }
    next();
  };
};

const isInstructor = (req, res, next) => {
  if (!req.user || req.user.userType !== 'instructor') {
    return res.status(403).json({ error: 'Acceso denegado. Solo instructores.' });
  }
  next();
};

const isAprendiz = (req, res, next) => {
  if (!req.user || req.user.userType !== 'aprendiz') {
    return res.status(403).json({ error: 'Acceso denegado. Solo aprendices.' });
  }
  next();
};

module.exports = { roleMiddleware, isInstructor, isAprendiz };
