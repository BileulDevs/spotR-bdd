const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premium.controller');

/**
 * @swagger
 * tags:
 *   - name: Premium
 *     description: Gestion des offres premium
 */

/**
 * @swagger
 * /api/premium:
 *   get:
 *     tags:
 *       - Premium
 *     summary: Récupérer toutes les offres premium
 *     responses:
 *       200:
 *         description: Liste des offres premium
 */
router.get('/', premiumController.getAllPremiums);

/**
 * @swagger
 * /api/premium/{id}:
 *   get:
 *     tags:
 *       - Premium
 *     summary: Récupérer une offre premium par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’offre premium
 *     responses:
 *       200:
 *         description: Offre trouvée
 *       404:
 *         description: Offre non trouvée
 */
router.get('/:id', premiumController.getPremiumById);

/**
 * @swagger
 * /api/premium:
 *   post:
 *     tags:
 *       - Premium
 *     summary: Créer une nouvelle offre premium
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: integer
 *             required:
 *               - name
 *               - price
 *               - duration
 *     responses:
 *       201:
 *         description: Offre créée
 *       400:
 *         description: Données invalides
 */
router.post('/', premiumController.createPremium);

/**
 * @swagger
 * /api/premium/{id}:
 *   put:
 *     tags:
 *       - Premium
 *     summary: Mettre à jour une offre premium
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’offre à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Offre mise à jour
 *       404:
 *         description: Offre non trouvée
 */
router.put('/:id', premiumController.updatePremium);

/**
 * @swagger
 * /api/premium/{id}:
 *   delete:
 *     tags:
 *       - Premium
 *     summary: Supprimer une offre premium
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’offre à supprimer
 *     responses:
 *       200:
 *         description: Offre supprimée
 *       404:
 *         description: Offre non trouvée
 */
router.delete('/:id', premiumController.deletePremium);

module.exports = router;
