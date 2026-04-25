const reportController = require('../src/controllers/reportController');
const Report = require('../src/models/Report');

jest.mock('../src/models/Report');

describe('Report Controller', () => {
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

    describe('createReport', () => {
        it('should create a report', async () => {
            mockReq.body = { reporterId: '1', targetType: 'Post', targetId: 'p1', reason: 'spam' };
            const mockSave = jest.fn();
            Report.mockImplementation(() => ({ save: mockSave }));

            await reportController.createReport(mockReq, mockRes);

            expect(mockSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    describe('getReports', () => {
        it('should get reports with optional status filter', async () => {
            mockReq.query.status = 'Pending';

            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ id: 'r1' }])
            };
            Report.find.mockReturnValue(mockChain);

            await reportController.getReports(mockReq, mockRes);

            expect(Report.find).toHaveBeenCalledWith({ status: 'Pending' });
            expect(mockRes.json).toHaveBeenCalledWith([{ id: 'r1' }]);
        });
    });

    describe('updateReportStatus', () => {
        it('should return 404 if report not found', async () => {
            mockReq.params.reportId = 'r1';
            mockReq.body.status = 'Reviewed';
            Report.findByIdAndUpdate.mockResolvedValue(null);

            await reportController.updateReportStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should update status and return report', async () => {
            mockReq.params.reportId = 'r1';
            mockReq.body.status = 'Reviewed';
            const updatedReport = { id: 'r1', status: 'Reviewed' };
            Report.findByIdAndUpdate.mockResolvedValue(updatedReport);

            await reportController.updateReportStatus(mockReq, mockRes);

            expect(Report.findByIdAndUpdate).toHaveBeenCalledWith('r1', { status: 'Reviewed' }, { new: true });
            expect(mockRes.json).toHaveBeenCalledWith(updatedReport);
        });
    });
});
