const jwt = require('jsonwebtoken');

// Generate Access Token
const generateAccessToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );
};

// Generate Refresh Token
const generateRefreshToken = (userId, tokenId) => {
    return jwt.sign(
        { userId, tokenId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }
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
