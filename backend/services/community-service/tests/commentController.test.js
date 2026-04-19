const commentController = require('../src/controllers/commentController');
const Comment = require('../src/models/Comment');
const Post = require('../src/models/Post');
const Report = require('../src/models/Report');
const { emitEvent } = require('../src/utils/kafkaProducer');

jest.mock('../src/models/Comment');
jest.mock('../src/models/Post');
jest.mock('../src/models/Report');
jest.mock('../src/utils/kafkaProducer');

describe('Comment Controller', () => {
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

    describe('addComment', () => {
        it('should return 404 if post not found', async () => {
            mockReq.params.postId = '1';
            Post.findById.mockResolvedValue(null);

            await commentController.addComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should create comment and emit event if not author', async () => {
            mockReq.params.postId = 'p1';
            mockReq.body = { authorId: '2', content: 'hello' };
            Post.findById.mockResolvedValue({ _id: 'p1', authorId: '1' });

            const commentSaveSpy = jest.fn();
            Comment.mockImplementation(() => ({ _id: 'c1', save: commentSaveSpy }));

            await commentController.addComment(mockReq, mockRes);

            expect(commentSaveSpy).toHaveBeenCalled();
            expect(emitEvent).toHaveBeenCalledWith('community-events', 'post_commented', {
                commenterId: '2',
                authorId: '1',
                postId: 'p1',
                commentId: 'c1'
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    describe('getComments', () => {
        it('should retrieve comments for post', async () => {
            mockReq.params.postId = '1';
            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ id: 'c1' }])
            };
            Comment.find.mockReturnValue(mockChain);

            await commentController.getComments(mockReq, mockRes);

            expect(Comment.find).toHaveBeenCalledWith({ postId: '1' });
            expect(mockRes.json).toHaveBeenCalledWith([{ id: 'c1' }]);
        });
    });

    describe('deleteComment', () => {
        it('should return 403 if unauthorized', async () => {
            mockReq.params.commentId = 'c1';
            mockReq.body = { authorId: '1' };
            Comment.findById.mockResolvedValue({ authorId: '2' });

            await commentController.deleteComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should delete if authorized', async () => {
            mockReq.params.commentId = 'c1';
            mockReq.body = { authorId: '1' };
            Comment.findById.mockResolvedValue({ authorId: '1' });

            await commentController.deleteComment(mockReq, mockRes);

            expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('c1');
            expect(mockRes.json).toHaveBeenCalled();
        });
    });

    describe('reportComment', () => {
        it('should increment report count and save report', async () => {
            mockReq.params.commentId = 'c1';
            mockReq.body = { reporterId: '2', reason: 'spam' };
            const comment = { isReported: false, reportCount: 0, save: jest.fn() };
            Comment.findById.mockResolvedValue(comment);

            const mockSaveReport = jest.fn();
            Report.mockImplementation(() => ({ save: mockSaveReport }));

            await commentController.reportComment(mockReq, mockRes);

            expect(comment.isReported).toBe(true);
            expect(comment.reportCount).toBe(1);
            expect(comment.save).toHaveBeenCalled();
            expect(mockSaveReport).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalled();
        });
    });
});
