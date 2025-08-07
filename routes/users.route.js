const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authenticate = require('../middlewares/authenticate');
const isAuthorized = require('../middlewares/isAuthorized');
const resetPassword = require('../middlewares/resetPassword');

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - User
 *     summary: Récupérer tous les utilisateurs
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get('/', usersController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - User
 *     summary: Récupérer un utilisateur par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', usersController.getUserById);

router.get('/username/:username', usersController.getUserByUsername);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - User
 *     summary: Créer un nouvel utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *               - username
 *     responses:
 *       201:
 *         description: Utilisateur créé
 */
router.post('/', usersController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Supprimer un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
router.delete('/:id', usersController.deleteUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - User
 *     summary: Mettre à jour les informations d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 */
router.put('/:id', isAuthorized, usersController.updateUser);

router.put('/:id/password', resetPassword, usersController.updateUserPassword);

/**
 * @swagger
 * /api/users/{id}/verify-email:
 *   post:
 *     tags:
 *       - User
 *     summary: Vérifier l'adresse email d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email vérifié
 *       400:
 *         description: Vérification échouée
 */
router.post('/:id/verify-email', usersController.verifyEmail);

/**
 * @swagger
 * /api/users/{id}/posts:
 *   get:
 *     tags:
 *       - User
 *     summary: Récupérer les posts d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des posts de l'utilisateur
 */
router.get('/:id/posts', usersController.getUserPosts);

module.exports = router;
