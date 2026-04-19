const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const RefreshToken = require('../models/RefreshToken');

const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;

    const accessToken  = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id, accessToken);

    await RefreshToken.create({
      userId    : user._id,
      token     : refreshToken,
      expiresAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // FIX: Previous code was missing userId and email in the redirect URL.
    // OAuthSuccessPage.jsx reads both via URLSearchParams:
    //   params.get("userId") → was null → setAuth({ id: null, ... }) → no identity in store
    //   params.get("email")  → was null → profile loads/API calls break silently
    // Now both are included so the frontend store is fully populated after OAuth login.
    const params = new URLSearchParams({
      token        : accessToken,
      refreshToken : refreshToken,
      role         : user.role,
      userId       : user._id.toString(),  // FIX: added
      email        : user.email,           // FIX: added
    });

    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?${params.toString()}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

module.exports = { googleCallback };