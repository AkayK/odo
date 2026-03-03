const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

const verifyToken = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};

const requireRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
