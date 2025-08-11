const httpMocks = require('node-mocks-http');
const User = require('../models/user');
const logger = require('../config/logger');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,
  getUserPosts,
} = require('../controllers/user.controller');

jest.mock('../models/user');
jest.mock('../config/logger');

describe('User Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user and return it', async () => {
      const req = httpMocks.createRequest({
        body: {
          username: 'testuser',
          email: 'test@test.com',
          password: 'password',
          provider: 'local',
        },
      });
      const res = httpMocks.createResponse();

      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);

      // Mock User.prototype.save to resolve to the user object
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        provider: 'local',
      });

      // Mock User.findById().populate() to return populated user
      const mockPopulatedUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@test.com',
        provider: 'local',
        subscription: [],
      };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedUser),
      });

      await createUser(req, res);

      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data).toMatchObject(mockPopulatedUser);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User created')
      );
    });

    it('should return 400 if username already exists', async () => {
      const req = httpMocks.createRequest({
        body: {
          username: 'testuser',
          email: 'test@test.com',
          password: 'password',
          provider: 'local',
        },
      });
      const res = httpMocks.createResponse();

      User.findOne.mockResolvedValue({ username: 'testuser' });

      await createUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getData()).toMatch(/Nom d'utilisateur déjà utilisé/);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      const users = [
        { _id: '1', username: 'u1', subscription: [] },
        { _id: '2', username: 'u2', subscription: [] },
      ];
      User.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(users),
      });

      await getUsers(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data.length).toBe(2);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetched')
      );
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      const user = { _id: '123', username: 'testuser', subscription: [] };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(user),
      });

      await getUserById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toMatchObject(user);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetched user')
      );
    });

    it('should return 404 if user not found', async () => {
      const req = httpMocks.createRequest({ params: { id: 'notfound' } });
      const res = httpMocks.createResponse();

      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getUserById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().message).toBe('User not found');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('User not found')
      );
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const req = httpMocks.createRequest({
        params: { id: '123' },
        body: {
          username: 'newuser',
          email: 'newemail@test.com',
          currentPassword: 'oldpass',
          password: 'newpass',
          confirmPassword: 'newpass',
        },
      });
      const res = httpMocks.createResponse();

      // Mock existing user with password
      const existingUser = {
        _id: '123',
        username: 'olduser',
        email: 'old@test.com',
        password: 'hashedOldPass',
      };
      User.findById.mockResolvedValue(existingUser);

      // Mock User.findOne to check username uniqueness
      User.findOne.mockResolvedValue(null);

      // Mock password comparison helper (simulate success)
      const comparePassword = require('../helpers/comparePassword');
      jest.spyOn(comparePassword, 'default').mockResolvedValue(true);

      // Mock cryptPassword helper to hash new password
      const cryptPassword = require('../helpers/cryptPassword');
      jest.spyOn(cryptPassword, 'default').mockResolvedValue('hashedNewPass');

      // Mock findByIdAndUpdate with populate
      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: '123',
          username: 'newuser',
          email: 'newemail@test.com',
          password: 'hashedNewPass',
          subscription: [],
        }),
      });

      // Execute updateUser
      await updateUser(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data.username).toBe('newuser');
      expect(data.password).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updated user')
      );
    });

    it('should return 404 if user not found', async () => {
      const req = httpMocks.createRequest({
        params: { id: 'notfound' },
        body: { username: 'test' },
      });
      const res = httpMocks.createResponse();

      User.findById.mockResolvedValue(null);

      await updateUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().message).toBe('Utilisateur non trouvé');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('User not found for update')
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      User.findByIdAndDelete.mockResolvedValue({ _id: '123' });

      await deleteUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().message).toMatch(/deleted successfully/i);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deleted user')
      );
    });

    it('should return 404 if user not found', async () => {
      const req = httpMocks.createRequest({ params: { id: 'notfound' } });
      const res = httpMocks.createResponse();

      User.findByIdAndDelete.mockResolvedValue(null);

      await deleteUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().message).toBe('User not found');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('User not found for deletion')
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      User.findByIdAndUpdate.mockResolvedValue(true);

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().message).toMatch(/Email vérifié/i);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Email vérifié')
      );
    });

    it('should return 500 on error', async () => {
      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      User.findByIdAndUpdate.mockRejectedValue(new Error('fail'));

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData().message).toMatch(/Error/i);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Erreur')
      );
    });
  });
});
