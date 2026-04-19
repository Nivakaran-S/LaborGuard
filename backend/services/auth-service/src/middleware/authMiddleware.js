const { verifyAccessToken } = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token validation failed'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyAccessToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        next(error);
    }
};

// Middleware to restrict access by roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = {
    protect: authMiddleware,
    authorize
};
