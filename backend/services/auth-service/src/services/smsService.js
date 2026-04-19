const twilio = require('twilio');

const sendVerificationSMS = async (toPhone, code) => {
    try {
        // Only initialize client if credentials exist
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.log('\n=============================================');
            console.log(`📱 [SIMULATED SMS to ${toPhone}]`);
            console.log(`Your LaborGuard verification code is: ${code}`);
            console.log('=============================================\n');
            return true;
        }

        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const message = await client.messages.create({
            body: `Your LaborGuard verification code is: ${code}. It expires in 15 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: toPhone
        });

        console.log('SMS sent:', message.sid);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw new Error('Failed to send verification SMS');
    }
};

module.exports = {
    sendVerificationSMS
};
