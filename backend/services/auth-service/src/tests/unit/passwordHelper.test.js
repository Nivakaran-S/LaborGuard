const {
    hashPassword,
    comparePassword,
    validatePasswordStrength
} = require('../../utils/passwordHelper');

describe('Password Helper Utilities', () => {
    describe('hashPassword', () => {
        it('should hash a password correctly', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await hashPassword(password);

            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(0);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching passwords', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await hashPassword(password);
            const isMatch = await comparePassword(password, hashedPassword);

            expect(isMatch).toBe(true);
        });

        it('should return false for non-matching passwords', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await hashPassword(password);
            const isMatch = await comparePassword('WrongPassword', hashedPassword);

            expect(isMatch).toBe(false);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should reject weak passwords', () => {
            expect(validatePasswordStrength('weak').valid).toBe(false);
            expect(validatePasswordStrength('12345678').valid).toBe(false); // No letters
            expect(validatePasswordStrength('Password').valid).toBe(false); // No numbers/special
        });

        it('should accept strong passwords', () => {
            expect(validatePasswordStrength('SecurePass123!').valid).toBe(true);
        });
    });
});
