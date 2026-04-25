const axios = require('axios');
const { analyzeText } = require('../src/utils/perspectiveApi');

jest.mock('axios');

describe('Perspective API Utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return not toxic for empty text', async () => {
        const result = await analyzeText('');

        expect(axios.post).not.toHaveBeenCalled();
        expect(result).toEqual({ isToxic: false, score: 0 });
    });

    it('should return not toxic when API key is not set', async () => {
        // PERSPECTIVE_API_KEY defaults to '' in the utility
        const result = await analyzeText('some text');

        // Since API key is empty in test environment, it should skip
        expect(result).toEqual({ isToxic: false, score: 0 });
    });

    it('should gracefully handle API errors', async () => {
        // Force the function to attempt API call by temporarily setting env
        const originalKey = process.env.PERSPECTIVE_API_KEY;
        process.env.PERSPECTIVE_API_KEY = 'test-key';

        // Re-require to pick up new env var
        jest.resetModules();
        const axios2 = require('axios');
        jest.mock('axios');
        axios2.post = jest.fn().mockRejectedValue(new Error('Network error'));

        const { analyzeText: freshAnalyze } = require('../src/utils/perspectiveApi');
        const result = await freshAnalyze('test content');

        // Should gracefully degrade
        expect(result.isToxic).toBe(false);

        process.env.PERSPECTIVE_API_KEY = originalKey;
    });
});
