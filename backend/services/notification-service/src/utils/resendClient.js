const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY || 're_your_resend_api_key';
const resend = new Resend(resendApiKey);

const SYSTEM_DEFAULT_EMAIL = process.env.SYSTEM_DEFAULT_EMAIL || 'notifications@laborguard.org';

const sendEmailNotification = async (toEmail, subject, htmlContent) => {
    try {
        if (!toEmail) return;

        const data = await resend.emails.send({
            from: `LaborGuard <${SYSTEM_DEFAULT_EMAIL}>`,
            to: [toEmail],
            subject: subject,
            html: htmlContent,
        });

        console.log(`[resendClient] Sent email to ${toEmail}, ID: ${data.id}`);
        return data;
    } catch (error) {
        console.error('[resendClient] Error sending email:', error.message);
        // Do not throw to prevent blocking the main process
    }
};

module.exports = {
    resend,
    sendEmailNotification
};
