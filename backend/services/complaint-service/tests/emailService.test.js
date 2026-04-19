const nodemailer = require('nodemailer');
const emailService = require('../src/services/emailService');

jest.mock('nodemailer');

describe('Email Service', () => {
    let mockTransporter;

    beforeEach(() => {
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-msg-id' })
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASS = 'password';
        jest.clearAllMocks();
    });

    it('should create a transporter and send mail', async () => {
        const mailOptions = { to: 'worker@example.com', subject: 'Test', html: '<p>Hi</p>' };
        const result = await emailService.sendComplaintConfirmationEmail(
            mailOptions.to,
            'John Doe',
            { _id: 'c1', title: 'Issue', category: 'wage_theft', priority: 'high', status: 'pending', createdAt: new Date() }
        );

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            service: 'gmail',
            auth: {
                user: 'test@example.com',
                pass: 'password'
            }
        });
        expect(mockTransporter.sendMail).toHaveBeenCalled();
        expect(result.messageId).toBe('test-msg-id');
    });

    it('should send status update email', async () => {
        const complaint = {
            _id: 'c1',
            title: 'Test Complaint',
            workerEmail: 'worker@example.com'
        };
        await emailService.sendStatusUpdateEmail(complaint, 'pending', 'resolved');
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'worker@example.com',
            subject: 'Complaint Status Updated — Test Complaint'
        }));
    });
});
