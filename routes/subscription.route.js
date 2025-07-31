const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');

/**
 * @swagger
 * tags:
 *   - name: Subscription
 *     description: Gestion des abonnements
 */

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Récupérer tous les abonnements
 *     responses:
 *       200:
 *         description: Liste des abonnements
 */
router.get('/', subscriptionController.getAllSubscriptions);

/**
 * @swagger
 * /api/subscriptions/search:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Rechercher des abonnements
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 */
router.get('/search', subscriptionController.searchSubscriptions);

/**
 * @swagger
 * /api/subscriptions/stats:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Obtenir les statistiques globales des abonnements
 *     responses:
 *       200:
 *         description: Statistiques des abonnements
 */
router.get('/stats', subscriptionController.getSubscriptionStats);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Obtenir un abonnement par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'abonnement
 *     responses:
 *       200:
 *         description: Abonnement trouvé
 *       404:
 *         description: Abonnement non trouvé
 */
router.get('/:id', subscriptionController.getSubscriptionById);

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Créer un nouvel abonnement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               premiumId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *             required:
 *               - userId
 *               - premiumId
 *     responses:
 *       201:
 *         description: Abonnement créé
 */
router.post('/', subscriptionController.createSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   put:
 *     tags:
 *       - Subscription
 *     summary: Remplacer un abonnement complet
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
 *     responses:
 *       200:
 *         description: Abonnement mis à jour
 */
router.put('/:id', subscriptionController.updateSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   patch:
 *     tags:
 *       - Subscription
 *     summary: Modifier partiellement un abonnement
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
 *     responses:
 *       200:
 *         description: Abonnement modifié
 */
router.patch('/:id', subscriptionController.patchSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   delete:
 *     tags:
 *       - Subscription
 *     summary: Supprimer un abonnement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Abonnement supprimé
 */
router.delete('/:id', subscriptionController.deleteSubscription);

/**
 * @swagger
 * /api/subscriptions/user/{userId}:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Récupérer tous les abonnements d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des abonnements de l'utilisateur
 */
router.get('/user/:userId', subscriptionController.getSubscriptionsByUser);

/**
 * @swagger
 * /api/subscriptions/user/{userId}/active:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Récupérer les abonnements actifs d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des abonnements actifs
 */
router.get('/user/:userId/active', subscriptionController.getActiveSubscriptionsByUser);

/**
 * @swagger
 * /api/subscriptions/{id}/cancel:
 *   patch:
 *     tags:
 *       - Subscription
 *     summary: Annuler un abonnement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Abonnement annulé
 */
router.patch('/:id/cancel', subscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}/renew:
 *   patch:
 *     tags:
 *       - Subscription
 *     summary: Renouveler un abonnement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Abonnement renouvelé
 */
router.patch('/:id/renew', subscriptionController.renewSubscription);

module.exports = router;
