const registryController = require('../src/controllers/registryController');
const registryService = require('../src/services/registryService');

jest.mock('../src/services/registryService');

describe('Registry Controller', () => {
    let mockReq, mockRes, mockNext;

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
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('registerOfficer', () => {
        it('should register a legal officer and return 201', async () => {
            const mockOfficer = { _id: 'off1', name: 'Legal Pro' };
            registryService.registerOfficer.mockResolvedValue(mockOfficer);

            await registryController.registerOfficer(mockReq, mockRes, mockNext);

            expect(registryService.registerOfficer).toHaveBeenCalledWith(mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Legal officer registered successfully.',
                data: mockOfficer
            });
        });
    });

    describe('getAllOfficers', () => {
        it('should return all officers', async () => {
            const mockResult = { officers: [], pagination: {} };
            registryService.getAllOfficers.mockResolvedValue(mockResult);

            await registryController.getAllOfficers(mockReq, mockRes, mockNext);

            expect(registryService.getAllOfficers).toHaveBeenCalledWith(mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getRegistryStats', () => {
        it('should return registry stats', async () => {
            const mockStats = { totalOfficers: 5 };
            registryService.getRegistryStats.mockResolvedValue(mockStats);

            await registryController.getRegistryStats(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockStats });
        });
    });

    describe('getOfficerById', () => {
        it('should return an officer by ID', async () => {
            mockReq.params.officerId = 'off1';
            const mockOfficer = { _id: 'off1' };
            registryService.getOfficerById.mockResolvedValue(mockOfficer);

            await registryController.getOfficerById(mockReq, mockRes, mockNext);

            expect(registryService.getOfficerById).toHaveBeenCalledWith('off1');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateOfficer', () => {
        it('should update officer details', async () => {
            mockReq.params.officerId = 'off1';
            mockReq.body = { name: 'Updated Name' };
            const mockOfficer = { _id: 'off1', name: 'Updated Name' };
            registryService.updateOfficer.mockResolvedValue(mockOfficer);

            await registryController.updateOfficer(mockReq, mockRes, mockNext);

            expect(registryService.updateOfficer).toHaveBeenCalledWith('off1', mockReq.body);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('deactivateOfficer', () => {
        it('should deactivate an officer', async () => {
            mockReq.params.officerId = 'off1';
            const mockOfficer = { _id: 'off1', isActive: false };
            registryService.deactivateOfficer.mockResolvedValue(mockOfficer);

            await registryController.deactivateOfficer(mockReq, mockRes, mockNext);

            expect(registryService.deactivateOfficer).toHaveBeenCalledWith('off1');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Legal officer deactivated successfully.',
                data: mockOfficer
            });
        });
    });
});
