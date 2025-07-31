const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

/**
 * @swagger
 * /api/auth/checkUser:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Vérifie si un utilisateur existe avant connexion
 *     description: Vérifie l’existence d’un utilisateur via son email (ou autre identifiant) avant d’autoriser la tentative de login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/checkUser', authController.checkUserForLogin);

module.exports = router;
