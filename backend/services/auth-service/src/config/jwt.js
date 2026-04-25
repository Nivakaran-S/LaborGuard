const jwt = require('jsonwebtoken');

// Defaults applied when JWT_ACCESS_EXPIRY / JWT_REFRESH_EXPIRY env vars aren't set.
// jwt.sign() throws if expiresIn is undefined or empty, so a default is required.
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Generate Access Token
//
// `sub` is required by Centrifugo for connection auth — the frontend reuses
// the access token verbatim as the Centrifugo connection token, and
// Centrifugo identifies the user via the JWT subject claim. Centrifugo
// rejects tokens without `sub` with a generic "connect" error.
//
// `userId` is preserved as a separate claim so existing protect middleware
// in every other service (which reads req.user.userId) keeps working.
const generateAccessToken = (userId, email, role) => {
    return jwt.sign(
        { sub: userId.toString(), userId, email, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
};

// Generate Refresh Token
const generateRefreshToken = (userId, tokenId) => {
    return jwt.sign(
        { userId, tokenId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
};

// Verify Access Token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        throw error;
    }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
