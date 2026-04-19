const jwt = require('jsonwebtoken');

// Verifies the JWT token from the Authorization header.
// Attaches the decoded user payload to req.user on success.
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);//

    // Attach user info to request for use in controllers
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Role-based access control middleware factory.
// Pass in the roles that are allowed to access the route.
// Usage: authorize('admin', 'lawyer')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };