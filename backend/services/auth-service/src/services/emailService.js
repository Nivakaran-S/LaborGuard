/**
 * emailService.js — auth-service
 *
 * All email goes through Resend (replaces Nodemailer/Gmail).
 * Required env: RESEND_API_KEY, SYSTEM_DEFAULT_EMAIL (must be on a verified
 * domain in your Resend dashboard).
 *
 * Public function signatures unchanged so callers (authService.js,
 * adminService.js) don't need updating.
 */

const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.SYSTEM_DEFAULT_EMAIL || 'notifications@laborguard.org';

// Lazy init so missing env doesn't crash boot — failures land at send time.
let _resend = null;
const getResend = () => {
    if (_resend) return _resend;
    if (!RESEND_API_KEY) {
        console.warn('[auth-service/email] RESEND_API_KEY not set — emails will silently fail');
        return null;
    }
    _resend = new Resend(RESEND_API_KEY);
    return _resend;
};

const send = async ({ to, subject, html }) => {
    const resend = getResend();
    if (!resend) return { skipped: true };
    const { data, error } = await resend.emails.send({
        from: `LaborGuard <${FROM}>`,
        to: [to],
        subject,
        html,
    });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return data;
};

const sendVerificationEmail = async (toEmail, code) => {
    console.log(`\n================================`);
    console.log(`[DEV MODE] OTP SENT TO ${toEmail}`);
    console.log(`CODE: ${code}`);
    console.log(`================================\n`);
    try {
        const info = await send({
            to: toEmail,
            subject: 'LaborGuard - Verify your Email',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome to LaborGuard!</h2>
                    <p>Thank you for registering. Please use the following 6-digit code to verify your email address. This code will expire in 15 minutes.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #0056b3; letter-spacing: 5px; margin: 0;">${code}</h1>
                    </div>
                </div>
            `,
        });
        console.log('Email sent:', info?.id);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error.message);
        throw new Error('Failed to send verification email');
    }
};

const sendPasswordResetEmail = async (toEmail, code) => {
    console.log(`\n================================`);
    console.log(`[DEV MODE] PASSWORD RESET OTP SENT TO ${toEmail}`);
    console.log(`CODE: ${code}`);
    console.log(`================================\n`);
    try {
        const info = await send({
            to: toEmail,
            subject: 'LaborGuard - Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>You recently requested to reset your password for your LaborGuard account. Use the code below to reset it. This code will expire in 15 minutes.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #d9534f; letter-spacing: 5px; margin: 0;">${code}</h1>
                    </div>
                    <p>If you did not request a password reset, please ignore this email.</p>
                </div>
            `,
        });
        console.log('Password Reset Email sent:', info?.id);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error.message);
        throw new Error('Failed to send password reset email');
    }
};

const sendApprovalEmail = async (toEmail, userName) => {
    try {
        await send({
            to: toEmail,
            subject: 'LaborGuard - Professional Account Approved',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #28a745;">Registration Approved!</h2>
                    <p>Hello ${userName || ''},</p>
                    <p>Great news! Your professional credentials have been reviewed and approved by the LaborGuard admin team.</p>
                    <p>You can now log in to the platform and access all your features.</p>
                    <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #0056b3; text-decoration: none; border-radius: 5px; margin-top: 15px;">Login to Your Account</a>
                </div>
            `,
        });
        console.log('Approval Email sent to:', toEmail);
        return true;
    } catch (error) {
        console.error('Error sending approval email:', error.message);
        return false; // Suppress throw — admin approval pipeline must not fail on email error
    }
};

const sendRejectionEmail = async (toEmail, userName, reason) => {
    try {
        await send({
            to: toEmail,
            subject: 'LaborGuard - Registration Update',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d9534f;">Registration Review Status</h2>
                    <p>Hello ${userName || ''},</p>
                    <p>Thank you for submitting your registration to LaborGuard. Unfortunately, we could not approve your professional credentials at this time.</p>
                    <p><strong>Reason provided by Admin:</strong></p>
                    <blockquote style="background: #fff3f3; border-left: 5px solid #d9534f; padding: 10px; margin: 15px 0;">${reason || 'Documents did not meet verification standards.'}</blockquote>
                    <p>Your pending account has been removed. You are welcome to re-register on our platform and upload the correct or updated documents.</p>
                    <a href="${process.env.FRONTEND_URL}/register" style="display: inline-block; padding: 10px 20px; color: white; background-color: #6c757d; text-decoration: none; border-radius: 5px; margin-top: 15px;">Register Again</a>
                </div>
            `,
        });
        console.log('Rejection Email sent to:', toEmail);
        return true;
    } catch (error) {
        console.error('Error sending rejection email:', error.message);
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendApprovalEmail,
    sendRejectionEmail,
};
