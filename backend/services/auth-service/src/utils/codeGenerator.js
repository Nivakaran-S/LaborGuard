const generateVerificationCode = () => {
    // Generate a random number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateCodeWithExpiry = (expiryMinutes = 10) => {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return { code, expiresAt };
};

module.exports = {
    generateVerificationCode,
    generateCodeWithExpiry
};
