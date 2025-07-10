const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');

// Routes CRUD de base
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/search', subscriptionController.searchSubscriptions);
router.get('/stats', subscriptionController.getSubscriptionStats);
router.get('/:id', subscriptionController.getSubscriptionById);
router.post('/', subscriptionController.createSubscription);
router.put('/:id', subscriptionController.updateSubscription);
router.patch('/:id', subscriptionController.patchSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

// Routes spécifiques aux utilisateurs
router.get('/user/:userId', subscriptionController.getSubscriptionsByUser);
router.get('/user/:userId/active', subscriptionController.getActiveSubscriptionsByUser);

// Routes d'actions spécifiques
router.patch('/:id/cancel', subscriptionController.cancelSubscription);
router.patch('/:id/renew', subscriptionController.renewSubscription);

module.exports = router;