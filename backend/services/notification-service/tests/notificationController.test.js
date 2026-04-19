const notificationController = require('../src/controllers/notificationController');
const Notification = require('../src/models/Notification');
const { emitEvent } = require('../src/utils/kafkaProducer');
const { sendEmailNotification } = require('../src/utils/resendClient');

jest.mock('../src/models/Notification');
jest.mock('../src/utils/kafkaProducer');
jest.mock('../src/utils/resendClient');

describe('Notification Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {},
            query: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    // ===== createNotification =====
    describe('createNotification', () => {
        it('should return 400 if required fields missing', async () => {
            mockReq.body = { userId: 'u1' }; // missing title, body
            await notificationController.createNotification(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should create notification successfully (with optional email)', async () => {
            mockReq.body = { userId: 'u1', title: 'Test', body: 'Body', email: 'test@example.com' };
            const mockSave = jest.fn();
            Notification.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = mockSave;
            });

            await notificationController.createNotification(mockReq, mockRes);

            expect(mockSave).toHaveBeenCalled();
            expect(sendEmailNotification).toHaveBeenCalledWith('test@example.com', expect.any(String), expect.any(String));
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    // ===== getNotifications =====
    describe('getNotifications', () => {
        it('should return paginated notifications', async () => {
            mockReq.params.userId = 'u1';

            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'n1' }])
            };
            Notification.find.mockReturnValue(mockChain);

            await notificationController.getNotifications(mockReq, mockRes);

            expect(Notification.find).toHaveBeenCalledWith({ userId: 'u1' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([{ _id: 'n1' }]);
        });
    });

    // ===== getUnreadCount =====
    describe('getUnreadCount', () => {
        it('should return count of unread notifications', async () => {
            mockReq.params.userId = 'u1';
            Notification.countDocuments.mockResolvedValue(5);

            await notificationController.getUnreadCount(mockReq, mockRes);

            expect(Notification.countDocuments).toHaveBeenCalledWith({ userId: 'u1', isRead: false });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ unreadCount: 5 });
        });
    });

    // ===== markAsRead =====
    describe('markAsRead', () => {
        it('should return 404 if not found', async () => {
            mockReq.params.id = 'n1';
            Notification.findByIdAndUpdate.mockResolvedValue(null);

            await notificationController.markAsRead(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should mark as read successfully', async () => {
            mockReq.params.id = 'n1';
            Notification.findByIdAndUpdate.mockResolvedValue({ _id: 'n1', isRead: true });

            await notificationController.markAsRead(mockReq, mockRes);

            expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
                'n1',
                { isRead: true },
                { new: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    // ===== markAllAsRead =====
    describe('markAllAsRead', () => {
        it('should mark all unread as read', async () => {
            mockReq.params.userId = 'u1';
            Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

            await notificationController.markAllAsRead(mockReq, mockRes);

            expect(Notification.updateMany).toHaveBeenCalledWith(
                { userId: 'u1', isRead: false },
                { isRead: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ modifiedCount: 3 }));
        });
    });

    // ===== deleteNotification =====
    describe('deleteNotification', () => {
        it('should return 404 if not found', async () => {
            mockReq.params.id = 'n1';
            Notification.findByIdAndDelete.mockResolvedValue(null);

            await notificationController.deleteNotification(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should delete notification successfully', async () => {
            mockReq.params.id = 'n1';
            Notification.findByIdAndDelete.mockResolvedValue({ _id: 'n1' });

            await notificationController.deleteNotification(mockReq, mockRes);

            expect(Notification.findByIdAndDelete).toHaveBeenCalledWith('n1');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
