const { checkUserForLogin } = require('../controllers/auth.controller');
const User = require('../models/user');
const logger = require('../config/logger');
const httpMocks = require('node-mocks-http');

jest.mock('../models/user');
jest.mock('../config/logger');

describe('checkUserForLogin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if user not found', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { email: 'nonexistent@test.com' },
    });
    const res = httpMocks.createResponse();

    User.findOne.mockResolvedValue(null);

    await checkUserForLogin(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({
      message: 'No user found with this email',
    });
    expect(logger.info).toHaveBeenCalledWith(
      `No user found for login with email: nonexistent@test.com`
    );
  });

  it('should return 200 and user data if user exists', async () => {
    const mockUser = {
      _id: '12345',
      email: 'user@test.com',
      username: 'TestUser',
      password: 'hashedpass',
    };

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { email: 'user@test.com' },
    });
    const res = httpMocks.createResponse();

    User.findOne.mockResolvedValue(mockUser);

    await checkUserForLogin(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockUser);
    expect(logger.info).toHaveBeenCalledWith(
      `User found for login: ${mockUser._id}`
    );
  });

  it('should return 500 if there is an error', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { email: 'error@test.com' },
    });
    const res = httpMocks.createResponse();

    User.findOne.mockRejectedValue(new Error('Database error'));

    await checkUserForLogin(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Database error' });
    expect(logger.error).toHaveBeenCalledWith('Erreur : Database error');
  });
});
