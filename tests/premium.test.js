const httpMocks = require('node-mocks-http');
const { 
  getAllPremiums,
  getPremiumById,
  createPremium,
  updatePremium,
  patchPremium,
  deletePremium
} = require('../controllers/premium.controller');

const Premium = require('../models/premium');
jest.mock('../models/premium');

describe('Premium Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPremiums', () => {
    it('should return all premiums', async () => {
      const mockPremiums = [{ title: 'Premium 1' }, { title: 'Premium 2' }];
      Premium.find.mockResolvedValue(mockPremiums);

      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      await getAllPremiums(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(mockPremiums);
    });
  });

  describe('getPremiumById', () => {
    it('should return a premium by ID', async () => {
      const mockPremium = { _id: '123', title: 'Premium' };
      Premium.findById.mockResolvedValue(mockPremium);

      const req = httpMocks.createRequest({ params: { id: '123' } });
      const res = httpMocks.createResponse();

      await getPremiumById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(mockPremium);
    });

    it('should return 404 if premium not found', async () => {
      Premium.findById.mockResolvedValue(null);

      const req = httpMocks.createRequest({ params: { id: 'notfound' } });
      const res = httpMocks.createResponse();

      await getPremiumById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData().message).toMatch(/non trouvé/i);
    });
  });

  describe('createPremium', () => {
    it('should create a new premium', async () => {
      const body = { title: 'New Premium' };
      const saved = { _id: 'abc123', ...body };

      Premium.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(saved),
      }));

      const req = httpMocks.createRequest({ method: 'POST', body });
      const res = httpMocks.createResponse();

      await createPremium(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual(saved);
    });

    it('should return 400 on creation error', async () => {
      Premium.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Erreur de création')),
      }));

      const req = httpMocks.createRequest({ method: 'POST', body: {} });
      const res = httpMocks.createResponse();

      await createPremium(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toMatch(/erreur.*création/i);
    });
  });

  describe('updatePremium', () => {
    it('should update an existing premium', async () => {
      const updated = { _id: 'id1', title: 'Updated' };
      Premium.findByIdAndUpdate.mockResolvedValue(updated);

      const req = httpMocks.createRequest({ params: { id: 'id1' }, body: { title: 'Updated' } });
      const res = httpMocks.createResponse();

      await updatePremium(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(updated);
    });

    it('should return 404 if premium not found', async () => {
      Premium.findByIdAndUpdate.mockResolvedValue(null);

      const req = httpMocks.createRequest({ params: { id: 'notfound' }, body: {} });
      const res = httpMocks.createResponse();

      await updatePremium(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 if update fails', async () => {
      Premium.findByIdAndUpdate.mockRejectedValue(new Error('Erreur update'));

      const req = httpMocks.createRequest({ params: { id: 'error' }, body: {} });
      const res = httpMocks.createResponse();

      await updatePremium(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().error).toBe('Erreur update');
    });
  });

  describe('patchPremium', () => {
    it('should patch an existing premium', async () => {
      const patched = { _id: 'id2', title: 'Partially Updated' };
      Premium.findByIdAndUpdate.mockResolvedValue(patched);

      const req = httpMocks.createRequest({ params: { id: 'id2' }, body: { title: 'Partially Updated' } });
      const res = httpMocks.createResponse();

      await patchPremium(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(patched);
    });

    it('should return 400 if patch fails', async () => {
      Premium.findByIdAndUpdate.mockRejectedValue(new Error('Erreur patch'));

      const req = httpMocks.createRequest({ params: { id: 'err' }, body: {} });
      const res = httpMocks.createResponse();

      await patchPremium(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().error).toBe('Erreur patch');
    });
  });

  describe('deletePremium', () => {
    it('should delete a premium by ID', async () => {
      const deleted = { _id: 'id3', title: 'To delete' };
      Premium.findByIdAndDelete.mockResolvedValue(deleted);

      const req = httpMocks.createRequest({ params: { id: 'id3' } });
      const res = httpMocks.createResponse();

      await deletePremium(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(deleted);
    });

    it('should return 404 if premium not found', async () => {
      Premium.findByIdAndDelete.mockResolvedValue(null);

      const req = httpMocks.createRequest({ params: { id: 'missing' } });
      const res = httpMocks.createResponse();

      await deletePremium(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should return 500 if delete fails', async () => {
      Premium.findByIdAndDelete.mockRejectedValue(new Error('Erreur delete'));

      const req = httpMocks.createRequest({ params: { id: 'fail' } });
      const res = httpMocks.createResponse();

      await deletePremium(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData().error).toBe('Erreur delete');
    });
  });
});
