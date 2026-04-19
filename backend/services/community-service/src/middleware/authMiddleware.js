
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization token missing' });
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    const msg = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message: msg });
  }
};


const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied: insufficient role' });
  next();
};

module.exports = { protect, authorize };
