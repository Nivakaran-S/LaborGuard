const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendVerificationEmail = async (toEmail, code) => {
  console.log(`\n================================`);
  console.log(`[DEV MODE] OTP SENT TO ${toEmail}`);
  console.log(`CODE: ${code}`);
  console.log(`================================\n`);
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
            `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Throwing error so caller knows delivery failed, but you can also choose to absorb it
    throw new Error('Failed to send verification email');
  }
};

const sendPasswordResetEmail = async (toEmail, code) => {
  console.log(`\n================================`);
  console.log(`[DEV MODE] PASSWORD RESET OTP SENT TO ${toEmail}`);
  console.log(`CODE: ${code}`);
  console.log(`================================\n`);
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
            `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password Reset Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

const sendApprovalEmail = async (toEmail, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
            `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval Email sent to: %s', toEmail);
    return true;
  } catch (error) {
    console.error('Error sending approval email:', error);
    // Suppress throw to avoid failing the admin approval pipeline
    return false;
  }
};

const sendRejectionEmail = async (toEmail, userName, reason) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
            `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection Email sent to: %s', toEmail);
    return true;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApprovalEmail,
  sendRejectionEmail
};
