const httpMocks = require('node-mocks-http');
const Subscription = require('../models/subscription');
const Premium = require('../models/premium');
const logger = require('../config/logger');

const {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionsByUser,
  getActiveSubscriptionsByUser,
  createSubscription,
  updateSubscription,
  patchSubscription,
  cancelSubscription,
  renewSubscription,
  deleteSubscription,
  searchSubscriptions,
  getSubscriptionStats
} = require('../controllers/subscription.controller');

jest.mock('../models/subscription');
jest.mock('../models/premium');
jest.mock('../config/logger');

describe('Subscription Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSubscriptions', () => {
    it('should return all subscriptions', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      const subscriptions = [{ _id: '1' }, { _id: '2' }];
      Subscription.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(subscriptions)
        })
      });

      await getAllSubscriptions(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(subscriptions);
    });

    it('should handle errors', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      Subscription.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('fail'))
      });

      await getAllSubscriptions(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData().success).toBe(false);
    });
  });

  describe('getSubscriptionById', () => {
    it('should return a subscription', async () => {
      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      const subscription = { _id: '123' };
      Subscription.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(subscription)
        })
      });

      await getSubscriptionById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(subscription);
    });

    it('should return 404 if not found', async () => {
      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      Subscription.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await getSubscriptionById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().success).toBe(false);
      expect(res._getJSONData().message).toMatch(/non trouvée/i);
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const req = httpMocks.createRequest({
        body: { userId: 'u1', premiumId: 'p1', duration: 30 }
      });
      const res = httpMocks.createResponse();

      const premium = { _id: 'p1', tarif: 10 };
      Premium.findById.mockResolvedValue(premium);

      const savedSubscription = {
        _id: 'sub1',
        userId: 'u1',
        premium: premium,
        amount: 10,
        startDate: new Date(),
        endDate: new Date()
      };
      Subscription.prototype.save = jest.fn().mockResolvedValue(savedSubscription);

      Premium.findByIdAndUpdate.mockResolvedValue(true);

      Subscription.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(savedSubscription)
        })
      });

      await createSubscription(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toMatchObject({ _id: 'sub1', amount: 10 });
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Subscription created'));
    });

    it('should return 404 if premium not found', async () => {
      const req = httpMocks.createRequest({ body: { premiumId: 'notfound' } });
      const res = httpMocks.createResponse();

      Premium.findById.mockResolvedValue(null);

      await createSubscription(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().success).toBe(false);
      expect(res._getJSONData().message).toMatch(/Premium non trouvé/i);
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription', async () => {
      const req = httpMocks.createRequest({
        params: { id: 'sub1' },
        body: { duration: 60 }
      });
      const res = httpMocks.createResponse();

      Subscription.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({ _id: 'sub1', duration: 60 })
        })
      });

      await updateSubscription(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().duration).toBe(60);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Subscription updated'));
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const req = httpMocks.createRequest({ params: { id: 'sub1' } });
      const res = httpMocks.createResponse();

      Subscription.findById.mockResolvedValue({
        _id: 'sub1',
        canceled: false,
        save: jest.fn().mockResolvedValue(true)
      });

      await cancelSubscription(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().message).toMatch(/Annulation/i);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Subscription cancelled'));
    });

    it('should return 404 if subscription not found', async () => {
      const req = httpMocks.createRequest({ params: { id: 'notfound' } });
      const res = httpMocks.createResponse();

      Subscription.findById.mockResolvedValue(null);

      await cancelSubscription(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().success).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Subscription not found'));
    });
  });

  // Ajoute des tests similaires pour patchSubscription, renewSubscription, deleteSubscription, searchSubscriptions, getSubscriptionStats etc.

});
