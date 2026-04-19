jest.mock('nsfwjs');
jest.mock('@tensorflow/tfjs', () => ({
    tensor3d: jest.fn(() => ({ dispose: jest.fn() }))
}));
jest.mock('jpeg-js', () => ({
    decode: jest.fn(() => ({
        data: new Uint8Array(12),
        width: 1,
        height: 1
    }))
}));
jest.mock('pngjs', () => ({
    PNG: {
        sync: {
            read: jest.fn(() => ({
                data: new Uint8Array(4),
                width: 1,
                height: 1
            }))
        }
    }
}));

describe('NSFWJS Check Utility', () => {
    let classifyImage, nsfwjs;

    beforeEach(() => {
        jest.resetModules();

        jest.mock('nsfwjs');
        jest.mock('@tensorflow/tfjs', () => ({
            tensor3d: jest.fn(() => ({ dispose: jest.fn() }))
        }));
        jest.mock('jpeg-js', () => ({
            decode: jest.fn(() => ({
                data: new Uint8Array(12),
                width: 1,
                height: 1
            }))
        }));
        jest.mock('pngjs', () => ({
            PNG: {
                sync: {
                    read: jest.fn(() => ({
                        data: new Uint8Array(4),
                        width: 1,
                        height: 1
                    }))
                }
            }
        }));

        nsfwjs = require('nsfwjs');
        ({ classifyImage } = require('../src/utils/nsfwCheck'));
    });

    it('should classify a safe image as not NSFW', async () => {
        const mockClassify = jest.fn().mockResolvedValue([
            { className: 'Neutral', probability: 0.9 },
            { className: 'Drawing', probability: 0.05 },
            { className: 'Porn', probability: 0.02 },
            { className: 'Hentai', probability: 0.01 },
            { className: 'Sexy', probability: 0.02 }
        ]);
        nsfwjs.load.mockResolvedValue({ classify: mockClassify });

        const result = await classifyImage(Buffer.from('safe-image'), 'image/jpeg');

        expect(result.isNSFW).toBe(false);
        expect(result.nsfwScore).toBeLessThan(0.5);
        expect(result.scores.Neutral).toBe(0.9);
    });

    it('should classify an NSFW image as NSFW', async () => {
        const mockClassify = jest.fn().mockResolvedValue([
            { className: 'Neutral', probability: 0.1 },
            { className: 'Drawing', probability: 0.05 },
            { className: 'Porn', probability: 0.6 },
            { className: 'Hentai', probability: 0.1 },
            { className: 'Sexy', probability: 0.15 }
        ]);
        nsfwjs.load.mockResolvedValue({ classify: mockClassify });

        const result = await classifyImage(Buffer.from('nsfw-image'), 'image/jpeg');

        expect(result.isNSFW).toBe(true);
        expect(result.nsfwScore).toBeGreaterThanOrEqual(0.5);
    });

    it('should gracefully handle classification errors', async () => {
        nsfwjs.load.mockRejectedValue(new Error('Model load failed'));

        const result = await classifyImage(Buffer.from('broken'), 'image/jpeg');

        expect(result.isNSFW).toBe(false);
        expect(result.nsfwScore).toBe(0);
    });
});
