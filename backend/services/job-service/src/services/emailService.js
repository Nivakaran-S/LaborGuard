const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

const sendApplicationStatusEmail = async (toEmail, workerName, jobTitle, status, extraData = {}) => {
    try {
        const isAccepted = status === 'accepted';
        const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

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

        if (!hasCredentials) {
            console.log('\n--- [EMAIL PREVIEW MODE] ---');
            console.log(`TO: ${toEmail}`);
            console.log(`SUBJECT: ${subject}`);
            console.log(`STATUS: ${status.toUpperCase()}`);
            if (!isAccepted) console.log(`REASON: ${extraData.rejectionReason}`);
            console.log('--- CONTENT START ---');
            console.log(html.replace(/<[^>]*>?/gm, '')); 
            console.log('--- [END PREVIEW] ---\n');
            return true;
        }

        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject,
            html,
            attachments: []
        };

        if (isAccepted && extraData.contractPdfBuffer) {
            mailOptions.attachments.push({
                filename: `Employment_Contract_${workerName.replace(/\s+/g, '_')}.pdf`,
                content: extraData.contractPdfBuffer,
                contentType: 'application/pdf'
            });
        }

        await transporter.sendMail(mailOptions);
        console.log(`Application ${status} email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending application status email:', error);
        return false;
    }
};

module.exports = {
    sendApplicationStatusEmail
};
