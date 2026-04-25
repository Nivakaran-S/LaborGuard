/**
 * emailService.js — job-service
 *
 * All email goes through Resend (replaces Nodemailer/Gmail).
 * Required env: RESEND_API_KEY, SYSTEM_DEFAULT_EMAIL (must be on a verified
 * domain in your Resend dashboard).
 *
 * Public function `sendApplicationStatusEmail(...)` signature unchanged so
 * jobController callers don't need updating. Supports PDF attachments
 * (employment contracts) — Resend accepts attachments as base64 strings.
 */

const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.SYSTEM_DEFAULT_EMAIL || 'notifications@laborguard.org';

let _resend = null;
const getResend = () => {
    if (_resend) return _resend;
    if (!RESEND_API_KEY) {
        return null;
    }
    _resend = new Resend(RESEND_API_KEY);
    return _resend;
};

const sendApplicationStatusEmail = async (toEmail, workerName, jobTitle, status, extraData = {}) => {
    try {
        const isAccepted = status === 'accepted';

        const subject = isAccepted
            ? `Congratulations! Your application for "${jobTitle}" was Accepted`
            : `Status Update: Your application for "${jobTitle}"`;

        const html = isAccepted ? `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2589f5;">Congratulations, ${workerName}!</h2>
                <p>Your application for the formal position of <strong>${jobTitle}</strong> has been <strong>ACCEPTED</strong>.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #2589f5; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Arrival & Logistics</h3>
                    <p><strong>Organization Details:</strong> ${extraData.orgDetails || 'LaborGuard Partner'}</p>
                    <p><strong>Date to Arrive:</strong> ${extraData.arrivalDate || 'To be communicated'}</p>
                    <p><strong>Site Location:</strong> ${extraData.location || 'See attached contract'}</p>
                </div>
                ${extraData.contractHtml ? '<p>We have automatically generated a <strong>Formal AI Employment Contract</strong> attached to this email. Please review it carefully.</p>' : ''}
                <p>Thank you for participating in the formalization initiative via LaborGuard!</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.85rem; color: #777;">Secure Fair Work • LaborGuard Team</p>
            </div>
        ` : `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #64748b;">Application Status Updated</h2>
                <p>Hello ${workerName},</p>
                <p>We wanted to inform you that your application for the position of <strong>${jobTitle}</strong> was not selected at this time.</p>

                <div style="background-color: #fffbfa; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #ef4444;">Feedback / Reason</h3>
                    <p><em>"${extraData.rejectionReason || 'Did not meet current role requirements.'}"</em></p>
                </div>

                <p>Don't be discouraged! Continue upskilling and improving your profile to land your next formal opportunity.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.85rem; color: #777;">Secure Fair Work • LaborGuard Team</p>
            </div>
        `;

        const resend = getResend();
        if (!resend) {
            // Preview mode for local dev — log instead of sending.
            console.log('\n--- [EMAIL PREVIEW MODE — RESEND_API_KEY not set] ---');
            console.log(`TO: ${toEmail}`);
            console.log(`SUBJECT: ${subject}`);
            console.log(`STATUS: ${status.toUpperCase()}`);
            if (!isAccepted) console.log(`REASON: ${extraData.rejectionReason}`);
            console.log('--- CONTENT START ---');
            console.log(html.replace(/<[^>]*>?/gm, ''));
            console.log('--- [END PREVIEW] ---\n');
            return true;
        }

        const payload = {
            from: `LaborGuard <${FROM}>`,
            to: [toEmail],
            subject,
            html,
        };

        // Resend attachments: { filename, content (base64 string or Buffer) }
        if (isAccepted && extraData.contractPdfBuffer) {
            payload.attachments = [{
                filename: `Employment_Contract_${workerName.replace(/\s+/g, '_')}.pdf`,
                content: Buffer.isBuffer(extraData.contractPdfBuffer)
                    ? extraData.contractPdfBuffer.toString('base64')
                    : extraData.contractPdfBuffer,
            }];
        }

        const { data, error } = await resend.emails.send(payload);
        if (error) {
            console.error('Error sending application status email:', error.message || error);
            return false;
        }
        console.log(`Application ${status} email sent to ${toEmail} — ID: ${data?.id}`);
        return true;
    } catch (error) {
        console.error('Error sending application status email:', error);
        return false;
    }
};

module.exports = {
    sendApplicationStatusEmail,
};
