const { moderateImages } = require('../src/middleware/imageModeration');
const { classifyImage } = require('../src/utils/nsfwCheck');

jest.mock('../src/utils/nsfwCheck');

describe('Image Moderation Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { files: null, file: null };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next() if no files uploaded', async () => {
        mockReq.files = [];

        await moderateImages(mockReq, mockRes, mockNext);

        expect(classifyImage).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() if all images are safe', async () => {
        mockReq.files = [
            { buffer: Buffer.from('img1'), mimetype: 'image/jpeg' },
            { buffer: Buffer.from('img2'), mimetype: 'image/png' }
        ];
        classifyImage.mockResolvedValue({ isNSFW: false, nsfwScore: 0.1, scores: { Neutral: 0.9 } });

        await moderateImages(mockReq, mockRes, mockNext);

        expect(classifyImage).toHaveBeenCalledTimes(2);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if any image is NSFW', async () => {
        mockReq.files = [
            { buffer: Buffer.from('safe'), mimetype: 'image/jpeg' },
            { buffer: Buffer.from('nsfw'), mimetype: 'image/png' }
        ];
        classifyImage
            .mockResolvedValueOnce({ isNSFW: false, nsfwScore: 0.1, scores: {} })
            .mockResolvedValueOnce({ isNSFW: true, nsfwScore: 0.85, scores: { Porn: 0.7, Sexy: 0.15 } });

        await moderateImages(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Image flagged as inappropriate content' })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip video files (only check images)', async () => {
        mockReq.files = [
            { buffer: Buffer.from('video'), mimetype: 'video/mp4' }
        ];

        await moderateImages(mockReq, mockRes, mockNext);

        expect(classifyImage).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle single file via req.file', async () => {
        mockReq.file = { buffer: Buffer.from('img'), mimetype: 'image/jpeg' };
        classifyImage.mockResolvedValue({ isNSFW: false, nsfwScore: 0.05, scores: {} });

        await moderateImages(mockReq, mockRes, mockNext);

        expect(classifyImage).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() on classification error (graceful degradation)', async () => {
        mockReq.files = [{ buffer: Buffer.from('img'), mimetype: 'image/jpeg' }];
        classifyImage.mockRejectedValue(new Error('Model load failed'));

        await moderateImages(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
