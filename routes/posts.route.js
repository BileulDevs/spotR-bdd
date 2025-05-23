const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authenticate = require("../helpers/authenticate");

router.post('/', authenticate, postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);
router.put('/like/:id', postController.likePost);

module.exports = router;