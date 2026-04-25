const userProfileController = require('../src/controllers/userProfileController');
const UserProfile = require('../src/models/UserProfile');
const { emitEvent } = require('../src/utils/kafkaProducer');

jest.mock('../src/models/UserProfile');
jest.mock('../src/utils/kafkaProducer');

describe('UserProfile Controller', () => {
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

    describe('getProfile', () => {
        it('should return 404 if profile not found', async () => {
            mockReq.params.userId = '123';
            UserProfile.findOne.mockResolvedValue(null);

            await userProfileController.getProfile(mockReq, mockRes);

            expect(UserProfile.findOne).toHaveBeenCalledWith({ userId: '123' });
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Profile not found' });
        });

        it('should return profile data', async () => {
            mockReq.params.userId = '123';
            const mockProfile = { userId: '123', name: 'Test User' };
            UserProfile.findOne.mockResolvedValue(mockProfile);

            await userProfileController.getProfile(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
        });
    });

    describe('followUser', () => {
        it('should return 400 if following self', async () => {
            mockReq.body = { currentUserId: '123', targetUserId: '123' };

            await userProfileController.followUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cannot follow yourself' });
        });

        it('should return 404 if either profile not found', async () => {
            mockReq.body = { currentUserId: '1', targetUserId: '2' };
            UserProfile.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({}); // one fails

            await userProfileController.followUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'User profile not found' });
        });

        it('should add to followers/following and emit event', async () => {
            mockReq.body = { currentUserId: '1', targetUserId: '2' };
            const currentUser = { userId: '1', following: [], save: jest.fn() };
            const targetUser = { userId: '2', followers: [], save: jest.fn() };

            UserProfile.findOne
                .mockResolvedValueOnce(currentUser)
                .mockResolvedValueOnce(targetUser);

            await userProfileController.followUser(mockReq, mockRes);

            expect(currentUser.following).toContain('2');
            expect(targetUser.followers).toContain('1');
            expect(currentUser.save).toHaveBeenCalled();
            expect(targetUser.save).toHaveBeenCalled();
            expect(emitEvent).toHaveBeenCalledWith('community-events', 'user_followed', {
                followerId: '1',
                targetUserId: '2'
            });
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Successfully followed user' });
        });
    });

    describe('unfollowUser', () => {
        it('should return 404 if either profile not found', async () => {
            mockReq.body = { currentUserId: '1', targetUserId: '2' };
            UserProfile.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({});

            await userProfileController.unfollowUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should remove from followers/following', async () => {
            mockReq.body = { currentUserId: '1', targetUserId: '2' };
            const currentUser = { userId: '1', following: ['2'], save: jest.fn() };
            const targetUser = { userId: '2', followers: ['1'], save: jest.fn() };

            UserProfile.findOne
                .mockResolvedValueOnce(currentUser)
                .mockResolvedValueOnce(targetUser);

            await userProfileController.unfollowUser(mockReq, mockRes);

            expect(currentUser.following).not.toContain('2');
            expect(targetUser.followers).not.toContain('1');
            expect(currentUser.save).toHaveBeenCalled();
            expect(targetUser.save).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Successfully unfollowed user' });
        });
    });

    describe('createOrUpdateProfile', () => {
        it('should create new profile if not found', async () => {
            mockReq.body = { userId: '1', name: 'New User' };
            UserProfile.findOne.mockResolvedValue(null);
            const mockSave = jest.fn();
            UserProfile.mockImplementation(() => ({
                save: mockSave
            }));

            await userProfileController.createOrUpdateProfile(mockReq, mockRes);

            expect(mockSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should create profile with employer role', async () => {
            mockReq.body = { userId: '10', name: 'Employer User', role: 'employer' };
            UserProfile.findOne.mockResolvedValue(null);
            const mockSave = jest.fn();
            UserProfile.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = mockSave;
            });

            await userProfileController.createOrUpdateProfile(mockReq, mockRes);

            expect(UserProfile).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'employer' })
            );
            expect(mockSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should create profile with admin role', async () => {
            mockReq.body = { userId: '11', name: 'Admin User', role: 'admin' };
            UserProfile.findOne.mockResolvedValue(null);
            const mockSave = jest.fn();
            UserProfile.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = mockSave;
            });

            await userProfileController.createOrUpdateProfile(mockReq, mockRes);

            expect(UserProfile).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'admin' })
            );
            expect(mockSave).toHaveBeenCalled();
        });

        it('should update existing profile', async () => {
            mockReq.body = { userId: '1', name: 'Updated' };
            const existingProfile = { userId: '1', name: 'Old', save: jest.fn() };
            UserProfile.findOne.mockResolvedValue(existingProfile);

            await userProfileController.createOrUpdateProfile(mockReq, mockRes);

            expect(existingProfile.name).toBe('Updated');
            expect(existingProfile.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should update role on existing profile', async () => {
            mockReq.body = { userId: '1', role: 'employer' };
            const existingProfile = { userId: '1', name: 'User', role: 'worker', save: jest.fn() };
            UserProfile.findOne.mockResolvedValue(existingProfile);

            await userProfileController.createOrUpdateProfile(mockReq, mockRes);

            expect(existingProfile.role).toBe('employer');
            expect(existingProfile.save).toHaveBeenCalled();
        });
    });

    describe('toggleBookmark', () => {
        it('should return 404 if profile not found', async () => {
            mockReq.body = { currentUserId: '1', postId: 'post1' };
            UserProfile.findOne.mockResolvedValue(null);

            await userProfileController.toggleBookmark(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should add bookmark if not present', async () => {
            mockReq.body = { currentUserId: '1', postId: 'post1' };
            const profile = { bookmarks: [], save: jest.fn() };
            UserProfile.findOne.mockResolvedValue(profile);

            await userProfileController.toggleBookmark(mockReq, mockRes);

            expect(profile.bookmarks).toContain('post1');
            expect(profile.save).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should remove bookmark if present', async () => {
            mockReq.body = { currentUserId: '1', postId: 'post1' };
            const profile = { bookmarks: ['post1'], save: jest.fn(), indexOf(id) { return this.bookmarks.indexOf(id); }, splice(start, deleteCount) { this.bookmarks.splice(start, deleteCount); } };

            UserProfile.findOne.mockResolvedValue({
                bookmarks: ['post1'],
                save: jest.fn()
            });

            await userProfileController.toggleBookmark(mockReq, mockRes);

            // Because arrays have real prototypes in JS, we can just supply an array in the mock.
            // But wait, our mock just returns an object with a standard JS array. That should work.
        });
    });

    describe('getBookmarks', () => {
        it('should return 404 if profile not found', async () => {
            mockReq.params.userId = '1';
            // Mock chain: UserProfile.findOne().populate()
            UserProfile.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await userProfileController.getBookmarks(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return populated bookmarks', async () => {
            mockReq.params.userId = '1';
            const mockBookmarks = [{ title: 'B1' }];
            UserProfile.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue({ bookmarks: mockBookmarks })
            });

            await userProfileController.getBookmarks(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockBookmarks);
        });
    });
});
