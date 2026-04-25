const appointmentController = require('../src/controllers/appointmentController');
const appointmentService = require('../src/services/appointmentService');

jest.mock('../src/services/appointmentService');

describe('Appointment Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {},
            query: {},
            user: { userId: 'user123', role: 'admin' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('getAllAppointments', () => {
        it('should return all appointments and 200', async () => {
            const mockResult = { appointments: [], pagination: {} };
            appointmentService.getAllAppointments.mockResolvedValue(mockResult);

            await appointmentController.getAllAppointments(mockReq, mockRes, mockNext);

            expect(appointmentService.getAllAppointments).toHaveBeenCalledWith(mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult.appointments,
                pagination: mockResult.pagination
            });
        });
    });

    describe('getMyAppointments', () => {
        it('should return worker appointments', async () => {
            mockReq.user = { userId: 'worker1', role: 'worker' };
            const mockResult = { appointments: [] };
            appointmentService.getMyAppointments.mockResolvedValue(mockResult);

            await appointmentController.getMyAppointments(mockReq, mockRes, mockNext);

            expect(appointmentService.getMyAppointments).toHaveBeenCalledWith('worker1', mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getAssignedAppointments', () => {
        it('should return legal officer appointments', async () => {
            mockReq.user = { userId: 'officer1', role: 'lawyer' };
            const mockResult = { appointments: [] };
            appointmentService.getAssignedAppointments.mockResolvedValue(mockResult);

            await appointmentController.getAssignedAppointments(mockReq, mockRes, mockNext);

            expect(appointmentService.getAssignedAppointments).toHaveBeenCalledWith('officer1', mockReq.query);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getAppointmentById', () => {
        it('should return appointment details', async () => {
            mockReq.params.id = 'a1';
            const mockAppointment = { _id: 'a1' };
            appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

            await appointmentController.getAppointmentById(mockReq, mockRes, mockNext);

            expect(appointmentService.getAppointmentById).toHaveBeenCalledWith('a1', mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('confirmAppointment', () => {
        it('should confirm appointment', async () => {
            mockReq.params.id = 'a1';
            mockReq.body = { meetingLink: 'http://zoom.us' };
            const mockAppointment = { _id: 'a1', status: 'confirmed' };
            appointmentService.confirmAppointment.mockResolvedValue(mockAppointment);

            await appointmentController.confirmAppointment(mockReq, mockRes, mockNext);

            expect(appointmentService.confirmAppointment).toHaveBeenCalledWith('a1', mockReq.body, mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Appointment confirmed successfully.',
                data: mockAppointment
            });
        });
    });

    describe('rescheduleAppointment', () => {
        it('should reschedule appointment', async () => {
            mockReq.params.id = 'a1';
            mockReq.body = { scheduledAt: '2026-03-01' };
            const mockAppointment = { _id: 'a1', scheduledAt: '2026-03-01' };
            appointmentService.rescheduleAppointment.mockResolvedValue(mockAppointment);

            await appointmentController.rescheduleAppointment(mockReq, mockRes, mockNext);

            expect(appointmentService.rescheduleAppointment).toHaveBeenCalledWith('a1', mockReq.body, mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('cancelAppointment', () => {
        it('should cancel appointment', async () => {
            mockReq.params.id = 'a1';
            const mockAppointment = { _id: 'a1', status: 'cancelled' };
            appointmentService.cancelAppointment.mockResolvedValue(mockAppointment);

            await appointmentController.cancelAppointment(mockReq, mockRes, mockNext);

            expect(appointmentService.cancelAppointment).toHaveBeenCalledWith('a1', mockReq.body, mockReq.user);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
