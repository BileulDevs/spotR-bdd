const Post = require('../models/post');
const controller = require('../controllers/post.controller');
const httpMocks = require('node-mocks-http');

jest.mock('../models/post');

describe('Post Controller', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createPost', () => {
    it('should create and return a post', async () => {
      const req = httpMocks.createRequest({
        body: { title: 'Test Post' },
        user: { id: 'user123' },
      });
      const res = httpMocks.createResponse();

      const mockPost = {
        ...req.body,
        user: req.user.id,
        save: jest.fn().mockResolvedValue({ ...req.body, user: req.user.id }),
      };

      Post.mockImplementation(() => mockPost);

      await controller.createPost(req, res);
      expect(mockPost.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(201);
    });

    it('should return 400 on save error', async () => {
      const req = httpMocks.createRequest({
        body: { title: 'Bad Post' },
        user: { id: 'user123' },
      });
      const res = httpMocks.createResponse();

      const mockPost = {
        ...req.body,
        user: req.user.id,
        save: jest.fn().mockRejectedValue(new Error('Save error')),
      };

      Post.mockImplementation(() => mockPost);

      await controller.createPost(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({ error: 'Save error' });
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      const posts = [{ title: 'Post 1' }, { title: 'Post 2' }];
      Post.find.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(posts),
      });

      await controller.getAllPosts(req, res);
      expect(res._getJSONData()).toEqual(posts);
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      const post = { title: 'Sample Post' };
      Post.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(post),
      });

      const req = httpMocks.createRequest({ params: { id: 'abc123' } });
      const res = httpMocks.createResponse();

      await controller.getPostById(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(post);
    });

    it('should return 404 if not found', async () => {
      Post.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = httpMocks.createRequest({ params: { id: 'invalid' } });
      const res = httpMocks.createResponse();

      await controller.getPostById(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('updatePost', () => {
    it('should update and return the post', async () => {
      const updatedPost = { title: 'Updated Post' };
      Post.findByIdAndUpdate.mockResolvedValue(updatedPost);

      const req = httpMocks.createRequest({
        params: { id: 'post123' },
        body: { title: 'Updated Post' },
      });
      const res = httpMocks.createResponse();

      await controller.updatePost(req, res);
      expect(res._getJSONData()).toEqual(updatedPost);
    });

    it('should return 404 if not found', async () => {
      Post.findByIdAndUpdate.mockResolvedValue(null);

      const req = httpMocks.createRequest({
        params: { id: 'notfound' },
        body: {},
      });
      const res = httpMocks.createResponse();

      await controller.updatePost(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('deletePost', () => {
    it('should delete the post', async () => {
      Post.findByIdAndDelete.mockResolvedValue({ id: 'deletedId' });

      const req = httpMocks.createRequest({ params: { id: 'post123' } });
      const res = httpMocks.createResponse();

      await controller.deletePost(req, res);
      expect(res._getJSONData()).toEqual({
        message: 'Post deleted successfully',
      });
    });

    it('should return 404 if post not found', async () => {
      Post.findByIdAndDelete.mockResolvedValue(null);

      const req = httpMocks.createRequest({ params: { id: 'missing' } });
      const res = httpMocks.createResponse();

      await controller.deletePost(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('likePost', () => {
    it('should add like if user not in whoLiked', async () => {
      const post = {
        _id: 'post1',
        whoLiked: [],
        likes: 0,
        save: jest.fn().mockResolvedValue(),
      };

      Post.findById.mockResolvedValue(post);

      const req = httpMocks.createRequest({
        params: { id: 'post1' },
        body: { hasLiked: 'user1' },
      });
      const res = httpMocks.createResponse();

      await controller.likePost(req, res);
      expect(post.whoLiked).toContain('user1');
      expect(post.likes).toBe(1);
      expect(res.statusCode).toBe(200);
    });

    it('should remove like if user already liked', async () => {
      const post = {
        _id: 'post1',
        whoLiked: ['user1'],
        likes: 1,
        save: jest.fn().mockResolvedValue(),
      };

      Post.findById.mockResolvedValue(post);

      const req = httpMocks.createRequest({
        params: { id: 'post1' },
        body: { hasLiked: 'user1' },
      });
      const res = httpMocks.createResponse();

      await controller.likePost(req, res);
      expect(post.whoLiked).not.toContain('user1');
      expect(post.likes).toBe(0);
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 if user ID is missing', async () => {
      const req = httpMocks.createRequest({
        params: { id: 'post1' },
        body: {},
      });
      const res = httpMocks.createResponse();

      await controller.likePost(req, res);
      expect(res.statusCode).toBe(400);
    });
  });
});
