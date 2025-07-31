const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   - name: Post
 *     description: Gestion des publications utilisateur
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     tags:
 *       - Post
 *     summary: Créer une nouvelle publication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Post créé avec succès
 *       401:
 *         description: Non autorisé
 */
router.post('/', authenticate, postController.createPost);

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     tags:
 *       - Post
 *     summary: Récupérer le fil d'actualité (posts des abonnements)
 *     responses:
 *       200:
 *         description: Liste des posts du feed
 */
router.get('/feed', authenticate, postController.getFeed);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     tags:
 *       - Post
 *     summary: Récupérer tous les posts
 *     responses:
 *       200:
 *         description: Liste de tous les posts
 */
router.get('/', postController.getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     tags:
 *       - Post
 *     summary: Récupérer un post par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du post
 *     responses:
 *       200:
 *         description: Post trouvé
 *       404:
 *         description: Post non trouvé
 */
router.get('/:id', postController.getPostById);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     tags:
 *       - Post
 *     summary: Mettre à jour un post
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du post à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post mis à jour
 *       404:
 *         description: Post non trouvé
 */
router.put('/:id', postController.updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     tags:
 *       - Post
 *     summary: Supprimer un post
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du post à supprimer
 *     responses:
 *       200:
 *         description: Post supprimé
 *       404:
 *         description: Post non trouvé
 */
router.delete('/:id', postController.deletePost);

/**
 * @swagger
 * /api/posts/like/{id}:
 *   put:
 *     tags:
 *       - Post
 *     summary: Aimer ou désaimer un post
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du post à liker
 *     responses:
 *       200:
 *         description: Action de like/unlike réussie
 *       404:
 *         description: Post non trouvé
 */
router.put('/like/:id', postController.likePost);

module.exports = router;
