const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

const validatePasswordStrength = (password) => {
    // Min 8 chars
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    // At least 1 uppercase
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    // At least 1 lowercase
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    // At least 1 number
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    // At least 1 special char
    if (!/[!@#$%^&*]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }

    return { valid: true };
};

module.exports = {
    hashPassword,
    comparePassword,
    validatePasswordStrength
};
