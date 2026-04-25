/**
 * jwt.unit.test.js
 *
 * Pure unit test for the JWT helper. No Mongo, no Express, no network.
 * Verifies the access token contract that downstream services depend on:
 *   - generates a valid signed JWT
 *   - includes the `sub` claim (Centrifugo requires it)
 *   - includes userId/email/role claims (other services' protect middleware reads these)
 *   - verifyAccessToken round-trips successfully
 */

process.env.JWT_ACCESS_SECRET = 'unit-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';

const jwt = require('jsonwebtoken');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} = require('../../src/config/jwt');

describe('generateAccessToken', () => {
    const userId = '507f1f77bcf86cd799439011';
    const email = 'test@example.com';
    const role = 'worker';

    it('returns a non-empty string', () => {
        const token = generateAccessToken(userId, email, role);
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3); // JWT = header.payload.signature
    });

    it('includes sub claim equal to userId (required by Centrifugo)', () => {
        const token = generateAccessToken(userId, email, role);
        const decoded = jwt.decode(token);
        expect(decoded.sub).toBe(userId);
    });

    it('includes userId/email/role for downstream service auth middleware', () => {
        const token = generateAccessToken(userId, email, role);
        const decoded = jwt.decode(token);
        expect(decoded.userId).toBe(userId);
        expect(decoded.email).toBe(email);
        expect(decoded.role).toBe(role);
    });

    it('signs with JWT_ACCESS_SECRET (verifyAccessToken round-trips)', () => {
        const token = generateAccessToken(userId, email, role);
        const verified = verifyAccessToken(token);
        expect(verified.userId).toBe(userId);
    });

    it('rejects tokens signed with the wrong secret', () => {
        const bogusToken = jwt.sign({ userId }, 'different-secret', { expiresIn: '15m' });
        expect(() => verifyAccessToken(bogusToken)).toThrow();
    });

    it('uses the default 15m expiry when JWT_ACCESS_EXPIRY env is unset', () => {
        const token = generateAccessToken(userId, email, role);
        const decoded = jwt.decode(token);
        const lifetimeSec = decoded.exp - decoded.iat;
        expect(lifetimeSec).toBe(15 * 60);
    });
});

describe('generateRefreshToken', () => {
    it('signs with JWT_REFRESH_SECRET (separate from access)', () => {
        const token = generateRefreshToken('userid', 'tokenid');
        const verified = verifyRefreshToken(token);
        expect(verified.userId).toBe('userid');
        expect(verified.tokenId).toBe('tokenid');
    });

    it('refresh tokens are NOT accepted by access verifier (different secrets)', () => {
        const refresh = generateRefreshToken('userid', 'tokenid');
        expect(() => verifyAccessToken(refresh)).toThrow();
    });
});
