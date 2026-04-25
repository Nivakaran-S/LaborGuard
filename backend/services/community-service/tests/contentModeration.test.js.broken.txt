const { moderateContent } = require('../src/middleware/contentModeration');
const { analyzeText } = require('../src/utils/perspectiveApi');

jest.mock('../src/utils/perspectiveApi');

describe('Content Moderation Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next() if no content in body', async () => {
        mockReq.body = {};

        await moderateContent(mockReq, mockRes, mockNext);

        expect(analyzeText).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() if content is empty string', async () => {
        mockReq.body = { content: '   ' };

        await moderateContent(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() if content is not toxic', async () => {
        mockReq.body = { content: 'This is a friendly comment' };
        analyzeText.mockResolvedValue({ isToxic: false, score: 0.1 });

        await moderateContent(mockReq, mockRes, mockNext);

        expect(analyzeText).toHaveBeenCalledWith('This is a friendly comment');
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.toxicityScore).toBe(0.1);
    });

    it('should return 403 if content is toxic', async () => {
        mockReq.body = { content: 'toxic content here' };
        analyzeText.mockResolvedValue({ isToxic: true, score: 0.92 });

        await moderateContent(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Content flagged as toxic',
            toxicityScore: 0.92
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() on API error (graceful degradation)', async () => {
        mockReq.body = { content: 'some content' };
        analyzeText.mockRejectedValue(new Error('API timeout'));

        await moderateContent(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
