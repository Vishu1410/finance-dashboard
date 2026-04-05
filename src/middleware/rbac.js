const ROLE_LEVELS = { viewer: 1, analyst: 2, admin: 3 };

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
};

export const authorizeMinLevel = (minRole) => {
  return (req, res, next) => {
    if ((ROLE_LEVELS[req.user.role] || 0) < (ROLE_LEVELS[minRole] || 0)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum required: ${minRole}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
};