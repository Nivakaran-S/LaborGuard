const complaintController = require('../src/controllers/complaintController');
const complaintService = require('../src/services/complaintService');

jest.mock('../src/services/complaintService');

describe('Complaint Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {},
            query: {},
            files: [],
            user: { userId: 'user123', email: 'worker@example.com', name: 'John Doe', role: 'worker' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('createComplaint', () => {
        it('should create a complaint and return 201', async () => {
            const mockComplaint = { _id: 'c1', title: 'Test' };
            complaintService.createComplaint.mockResolvedValue(mockComplaint);

            await complaintController.createComplaint(mockReq, mockRes, mockNext);

            expect(complaintService.createComplaint).toHaveBeenCalledWith(
                { ...mockReq.body, attachments: [] },
                mockReq.user
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Complaint filed successfully. You will receive a confirmation email shortly.',
                data: mockComplaint
            });
        });

        it('should call next with error if service fails', async () => {
            const error = new Error('Service error');
            complaintService.createComplaint.mockRejectedValue(error);

            await complaintController.createComplaint(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getAllComplaints', () => {
        it('should return all complaints and 200', async () => {
            const mockResult = { complaints: [], pagination: {} };
            complaintService.getAllComplaints.mockResolvedValue(mockResult);

            await complaintController.getAllComplaints(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult.complaints,
                pagination: mockResult.pagination
            });
        });
    });

    describe('getMyComplaints', () => {
        it('should return worker complaints and 200', async () => {
            const mockResult = { complaints: [], pagination: {} };
            complaintService.getMyComplaints.mockResolvedValue(mockResult);

            await complaintController.getMyComplaints(mockReq, mockRes, mockNext);

            expect(complaintService.getMyComplaints).toHaveBeenCalledWith('user123', mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getComplaintById', () => {
        it('should return a complaint by ID', async () => {
            mockReq.params.id = 'c1';
            const mockComplaint = { _id: 'c1' };
            complaintService.getComplaintById.mockResolvedValue(mockComplaint);

            await complaintController.getComplaintById(mockReq, mockRes, mockNext);

            expect(complaintService.getComplaintById).toHaveBeenCalledWith('c1', mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockComplaint });
        });
    });

    describe('updateComplaint', () => {
        it('should update a complaint', async () => {
            mockReq.params.id = 'c1';
            mockReq.body = { title: 'Updated' };
            const mockComplaint = { _id: 'c1', title: 'Updated' };
            complaintService.updateComplaint.mockResolvedValue(mockComplaint);

            await complaintController.updateComplaint(mockReq, mockRes, mockNext);

            expect(complaintService.updateComplaint).toHaveBeenCalledWith('c1', mockReq.body, mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateComplaintStatus', () => {
        it('should update status', async () => {
            mockReq.params.id = 'c1';
            mockReq.body = { status: 'resolved', reason: 'Fixed' };
            const mockComplaint = { _id: 'c1', status: 'resolved' };
            complaintService.updateComplaintStatus.mockResolvedValue(mockComplaint);

            await complaintController.updateComplaintStatus(mockReq, mockRes, mockNext);

            expect(complaintService.updateComplaintStatus).toHaveBeenCalledWith('c1', mockReq.body, mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('assignComplaint', () => {
        it('should assign a complaint', async () => {
            mockReq.params.id = 'c1';
            mockReq.body.officerId = 'off1';
            const mockComplaint = { _id: 'c1', assignedTo: 'off1' };
            complaintService.assignComplaint.mockResolvedValue(mockComplaint);

            await complaintController.assignComplaint(mockReq, mockRes, mockNext);

            expect(complaintService.assignComplaint).toHaveBeenCalledWith('c1', 'off1', mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('deleteComplaint', () => {
        it('should delete a complaint', async () => {
            mockReq.params.id = 'c1';
            complaintService.deleteComplaint.mockResolvedValue();

            await complaintController.deleteComplaint(mockReq, mockRes, mockNext);

            expect(complaintService.deleteComplaint).toHaveBeenCalledWith('c1', mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getComplaintStats', () => {
        it('should return stats', async () => {
            const mockStats = { total: 10 };
            complaintService.getComplaintStats.mockResolvedValue(mockStats);

            await complaintController.getComplaintStats(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockStats });
        });
    });

    describe('uploadAttachment', () => {
        it('should upload an attachment and return 200', async () => {
            mockReq.params.id = 'c1';
            mockReq.file = { originalname: 'test.jpg', path: 'path/to/test.jpg', mimetype: 'image/jpeg' };
            const mockComplaint = { _id: 'c1', attachments: [mockReq.file] };
            complaintService.addAttachment.mockResolvedValue(mockComplaint);

            await complaintController.uploadAttachment(mockReq, mockRes, mockNext);

            expect(complaintService.addAttachment).toHaveBeenCalledWith('c1', mockReq.file, mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Attachment uploaded successfully.',
                data: mockComplaint
            });
        });

        it('should return 400 if no file is uploaded', async () => {
            mockReq.file = null;
            await complaintController.uploadAttachment(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });
    });

    describe('generateReport', () => {
        it('should generate a report and return it', async () => {
            mockReq.params.id = 'c1';
            const mockComplaint = { _id: 'c1', title: 'Test' };
            complaintService.getComplaintById.mockResolvedValue(mockComplaint);

            // Mock the required utility locally since it's required inside the controller
            const pdfGenerator = require('../src/utils/pdfGenerator');
            jest.mock('../src/utils/pdfGenerator', () => ({
                generateComplaintPDF: jest.fn()
            }));

            await complaintController.generateReport(mockReq, mockRes, mockNext);

            expect(complaintService.getComplaintById).toHaveBeenCalledWith('c1', mockReq.user);
        });
    });
});
