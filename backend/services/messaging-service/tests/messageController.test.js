const messageController = require('../src/controllers/messageController');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const { emitEvent } = require('../src/utils/kafkaProducer');
const { uploadToCloudinary } = require('../src/utils/cloudinaryConfig');
const { publishToChannel } = require('../src/utils/centrifugoClient');

jest.mock('../src/models/Conversation');
jest.mock('../src/models/Message');
jest.mock('../src/utils/kafkaProducer');
jest.mock('../src/utils/cloudinaryConfig');
jest.mock('../src/utils/centrifugoClient');

describe('Message Controller', () => {
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

    // ===== createConversation =====
    describe('createConversation', () => {
        it('should return 400 if less than 2 participants', async () => {
            mockReq.body = { participants: ['user1'] };
            await messageController.createConversation(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return existing 1-on-1 conversation if found', async () => {
            mockReq.body = { participants: ['u1', 'u2'], participantRoles: [], isGroup: false };
            Conversation.findOne.mockResolvedValue({ _id: 'conv1', participants: ['u1', 'u2'] });

            await messageController.createConversation(mockReq, mockRes);

            expect(Conversation.findOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'conv1' }));
        });

        it('should create new conversation', async () => {
            mockReq.body = { participants: ['u1', 'u2'], participantRoles: [], isGroup: false };
            Conversation.findOne.mockResolvedValue(null);

            const mockSave = jest.fn();
            Conversation.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = mockSave;
            });

            await messageController.createConversation(mockReq, mockRes);

            expect(mockSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    // ===== getConversations =====
    describe('getConversations', () => {
        it('should return paginated conversations', async () => {
            mockReq.params.userId = 'u1';

            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'conv1' }])
            };
            Conversation.find.mockReturnValue(mockChain);

            await messageController.getConversations(mockReq, mockRes);

            expect(Conversation.find).toHaveBeenCalledWith({ participants: 'u1' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([{ _id: 'conv1' }]);
        });
    });

    // ===== getMessages =====
    describe('getMessages', () => {
        it('should return 404 if conversation not found', async () => {
            mockReq.params.conversationId = 'c1';
            Conversation.findById.mockResolvedValue(null);

            await messageController.getMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return paginated messages', async () => {
            mockReq.params.conversationId = 'c1';
            Conversation.findById.mockResolvedValue({ _id: 'c1' });

            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'm1' }])
            };
            Message.find.mockReturnValue(mockChain);

            await messageController.getMessages(mockReq, mockRes);

            expect(Message.find).toHaveBeenCalledWith({ conversationId: 'c1' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([{ _id: 'm1' }]);
        });
    });

    // ===== sendMessage =====
    describe('sendMessage', () => {
        it('should return 400 if required fields missing (no content and no files)', async () => {
            mockReq.body = { senderId: 'u1' }; // missing conversationId
            await messageController.sendMessage(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if conversation not found', async () => {
            mockReq.body = { conversationId: 'c1', senderId: 'u1', content: 'hi' };
            Conversation.findById.mockResolvedValue(null);

            await messageController.sendMessage(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if sender not participant', async () => {
            mockReq.body = { conversationId: 'c1', senderId: 'u1', content: 'hi' };
            Conversation.findById.mockResolvedValue({ participants: ['u2', 'u3'] });

            await messageController.sendMessage(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should create message, upload files, update conversation, emit event, and publish to centrifugo', async () => {
            mockReq.body = { conversationId: 'c1', senderId: 'u1', content: 'hi here' };
            mockReq.files = [{ buffer: Buffer.from('test') }];

            const mockConvSave = jest.fn();
            const conversation = {
                _id: 'c1',
                participants: ['u1', 'u2'],
                isGroup: false,
                save: mockConvSave
            };
            Conversation.findById.mockResolvedValue(conversation);

            uploadToCloudinary.mockResolvedValue({ secure_url: 'http://img.png' });

            const mockMsgSave = jest.fn();
            Message.mockImplementation(function (data) {
                Object.assign(this, data);
                this._id = 'm1';
                this.createdAt = new Date();
                this.save = mockMsgSave;
            });

            await messageController.sendMessage(mockReq, mockRes);

            expect(uploadToCloudinary).toHaveBeenCalled();
            expect(mockMsgSave).toHaveBeenCalled();
            expect(mockConvSave).toHaveBeenCalled();
            expect(conversation.lastMessage.content).toBe('hi here');
            expect(emitEvent).toHaveBeenCalledWith('messaging-events', 'message_sent', expect.any(Object));
            expect(publishToChannel).toHaveBeenCalledWith('chat:c1', expect.objectContaining({ type: 'new_message' }));
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    // ===== markAsRead =====
    describe('markAsRead', () => {
        it('should return 400 if userId missing', async () => {
            mockReq.params.conversationId = 'c1';
            await messageController.markAsRead(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should update unread messages', async () => {
            mockReq.params.conversationId = 'c1';
            mockReq.body = { userId: 'u1' };

            Message.updateMany.mockResolvedValue({ modifiedCount: 2 });

            await messageController.markAsRead(mockReq, mockRes);

            expect(Message.updateMany).toHaveBeenCalledWith(
                { conversationId: 'c1', readBy: { $ne: 'u1' } },
                { $push: { readBy: 'u1' } }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ modifiedCount: 2 }));
        });
    });

    // ===== deleteMessage =====
    describe('deleteMessage', () => {
        it('should return 400 if senderId missing', async () => {
            mockReq.params.messageId = 'm1';
            await messageController.deleteMessage(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 403 if unauthorized', async () => {
            mockReq.params.messageId = 'm1';
            mockReq.body = { senderId: 'u2' };
            Message.findById.mockResolvedValue({ senderId: 'u1' });

            await messageController.deleteMessage(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should delete message', async () => {
            mockReq.params.messageId = 'm1';
            mockReq.body = { senderId: 'u1' };
            Message.findById.mockResolvedValue({ senderId: 'u1' });
            Message.findByIdAndDelete.mockResolvedValue(true);

            await messageController.deleteMessage(mockReq, mockRes);

            expect(Message.findByIdAndDelete).toHaveBeenCalledWith('m1');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
