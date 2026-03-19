const roleMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Acceso denegado. Rol no autorizado.' });
    }
    next();
  };
};

module.exports = roleMiddleware;
