const logger = require('../config/logger');
const Subscription = require('../models/subscription');
const Premium = require('../models/premium');
const User = require('../models/user');

/**
 * GET /subscriptions
 * Récupère toutes les subscriptions avec les données utilisateur et premium associées
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
exports.getAllSubscriptions = async (req, res) => {
  try {
    // Recherche toutes les subscriptions et peuple les références
    const subscriptions = await Subscription.find()
      .populate('userId') // Charge les données complètes de l'utilisateur
      .populate('premium', 'title tarif description'); // Charge seulement certains champs du premium
    
    res.status(200).json(subscriptions);
  } catch (error) {
    // Gestion d'erreur standardisée avec message explicite
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des subscriptions',
      error: error.message,
    });
  }
};

/**
 * GET /subscriptions/:id
 * Récupère une subscription spécifique par son ID
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId')
      .populate('premium', 'title tarif description');

    // Vérification si la subscription existe
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la subscription',
      error: error.message,
    });
  }
};

/**
 * GET /subscriptions/user/:userId
 * Récupère toutes les subscriptions d'un utilisateur spécifique
 * Triées par date de création (plus récentes en premier)
 * @param {Object} req - Objet de requête Express (contient req.params.userId)
 * @param {Object} res - Objet de réponse Express
 */
exports.getSubscriptionsByUser = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.params.userId })
      .populate('premium', 'title tarif description')
      .sort({ createdAt: -1 }); // Tri décroissant par date de création

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des subscriptions de l'utilisateur",
      error: error.message,
    });
  }
};

/**
 * GET /subscriptions/user/:userId/active
 * Récupère uniquement les subscriptions actives et non expirées d'un utilisateur
 * Conditions : status = 'active' ET endDate > maintenant
 * @param {Object} req - Objet de requête Express (contient req.params.userId)
 * @param {Object} res - Objet de réponse Express
 */
exports.getActiveSubscriptionsByUser = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.params.userId,
      status: 'active', // Statut actif
      endDate: { $gt: new Date() }, // Date de fin supérieure à maintenant
    })
      .populate('premium', 'title tarif description')
      .sort({ createdAt: -1 });

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des subscriptions actives',
      error: error.message,
    });
  }
};

/**
 * POST /subscriptions
 * Crée une nouvelle subscription pour un utilisateur
 * Calcule automatiquement les dates de début/fin et met à jour les compteurs
 * @param {Object} req - Objet de requête Express (contient userId, premiumId, duration)
 * @param {Object} res - Objet de réponse Express
 */
exports.createSubscription = async (req, res) => {
  try {
    const { userId, premiumId, duration = 30 } = req.body; // Durée par défaut : 30 jours
    
    // Vérification de l'existence du plan premium
    const premium = await Premium.findById(premiumId);
    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé',
      });
    }

    // Calcul automatique des dates de début et fin
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration); // Ajoute la durée en jours

    // Préparation des données de subscription
    const subscriptionData = {
      ...req.body,
      premium, // Référence vers le plan premium
      startDate,
      endDate,
      amount: premium.tarif, // Montant basé sur le tarif du plan premium
    };

    const subscription = new Subscription(subscriptionData);
    const savedSubscription = await subscription.save();

    // Logging de l'opération pour traçabilité
    logger.info(`Creating sub : ${savedSubscription._id}`);

    // Mise à jour des données liées
    await User.findByIdAndUpdate(userId, { subscription: savedSubscription }); // Associe la subscription à l'utilisateur
    await Premium.findByIdAndUpdate(premium, { $inc: { subCount: 1 } }); // Incrémente le compteur de subscriptions du plan

    // Retour de la subscription avec toutes les données peuplées
    const populatedSubscription = await Subscription.findById(savedSubscription._id)
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description');

    res.status(201).json(populatedSubscription);
  } catch (error) {
    logger.error('error creating sub', error);
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la subscription',
      error: error.message,
    });
  }
};

/**
 * PUT /subscriptions/:id
 * Met à jour complètement une subscription (remplace tous les champs)
 * @param {Object} req - Objet de requête Express (contient req.params.id et les nouvelles données)
 * @param {Object} res - Objet de réponse Express
 */
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body, // Remplace tous les champs par les nouvelles données
      {
        new: true, // Retourne le document mis à jour
        runValidators: true, // Exécute les validateurs Mongoose
      }
    )
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la subscription',
      error: error.message,
    });
  }
};

/**
 * PATCH /subscriptions/:id
 * Met à jour partiellement une subscription (modifie seulement les champs fournis)
 * Utilise $set pour une mise à jour sélective
 * @param {Object} req - Objet de requête Express (contient req.params.id et les champs à modifier)
 * @param {Object} res - Objet de réponse Express
 */
exports.patchSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Utilise $set pour mise à jour sélective
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour partielle de la subscription',
      error: error.message,
    });
  }
};

/**
 * PATCH /subscriptions/:id/cancel
 * Annule une subscription en changeant son statut et désactivant le renouvellement automatique
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled', // Change le statut à annulé
        autoRenew: false, // Désactive le renouvellement automatique
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    // Réponse avec message de confirmation
    res.status(200).json({
      success: true,
      message: 'Subscription annulée avec succès',
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de l'annulation de la subscription",
      error: error.message,
    });
  }
};

/**
 * PATCH /subscriptions/:id/renew
 * Renouvelle une subscription en étendant sa date de fin et réactivant son statut
 * @param {Object} req - Objet de requête Express (contient req.params.id et optionnellement duration)
 * @param {Object} res - Objet de réponse Express
 */
exports.renewSubscription = async (req, res) => {
  try {
    const { duration = 30 } = req.body; // Durée par défaut : 30 jours

    // Récupération de la subscription actuelle pour obtenir sa date de fin
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    // Calcul de la nouvelle date de fin (à partir de l'ancienne date de fin)
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    // Mise à jour avec la nouvelle date et statut actif
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        endDate: newEndDate,
        status: 'active', // Réactive la subscription
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description');

    res.status(200).json({
      success: true,
      message: 'Subscription renouvelée avec succès',
      data: updatedSubscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors du renouvellement de la subscription',
      error: error.message,
    });
  }
};

/**
 * DELETE /subscriptions/:id
 * Supprime définitivement une subscription et met à jour les compteurs associés
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    // Mise à jour du compteur de subscriptions du plan premium
    await Premium.findByIdAndUpdate(subscription.premium, {
      $inc: { subCount: -1 }, // Décrémente le compteur
    });

    res.status(200).json({
      success: true,
      message: 'Subscription supprimée avec succès',
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la subscription',
      error: error.message,
    });
  }
};

/**
 * GET /subscriptions/search
 * Recherche avancée avec pagination et filtres multiples
 * Supporte les filtres : status, userId, premium, startDate, endDate, etc.
 * @param {Object} req - Objet de requête Express (contient les paramètres de recherche en query)
 * @param {Object} res - Objet de réponse Express
 */
exports.searchSubscriptions = async (req, res) => {
  try {
    // Extraction des paramètres de recherche avec valeurs par défaut
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      premium,
      startDate,
      endDate,
      ...filters // Récupère tous les autres filtres
    } = req.query;

    // Construction de l'objet de filtres
    const searchFilters = { ...filters };

    // Ajout conditionnel des filtres principaux
    if (status) searchFilters.status = status;
    if (userId) searchFilters.userId = userId;
    if (premium) searchFilters.premium = premium;

    // Filtre par plage de dates de création
    if (startDate || endDate) {
      searchFilters.createdAt = {};
      if (startDate) searchFilters.createdAt.$gte = new Date(startDate);
      if (endDate) searchFilters.createdAt.$lte = new Date(endDate);
    }

    // Options de pagination (non utilisées dans cette implémentation)
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'premium', select: 'title tarif description' },
      ],
    };

    // Exécution de la recherche avec pagination manuelle
    const subscriptions = await Subscription.find(searchFilters)
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit)); // Calcul du décalage pour la pagination

    // Comptage total pour les métadonnées de pagination
    const total = await Subscription.countDocuments(searchFilters);

    // Réponse avec données et métadonnées de pagination
    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)), // Calcul du nombre total de pages
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des subscriptions',
      error: error.message,
    });
  }
};

/**
 * GET /subscriptions/stats
 * Génère des statistiques avancées sur les subscriptions
 * Utilise l'agrégation MongoDB pour calculer les métriques
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
exports.getSubscriptionStats = async (req, res) => {
  try {
    // Agrégation pour statistiques par statut avec sommes
    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: '$status', // Groupement par statut
          count: { $sum: 1 }, // Comptage des documents
          totalAmount: { $sum: '$amount' }, // Somme des montants
        },
      },
    ]);

    // Comptages simples pour métriques générales
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: 'active',
      endDate: { $gt: new Date() }, // Actives et non expirées
    });

    // Réponse avec toutes les statistiques
    res.status(200).json({
      success: true,
      data: {
        totalSubscriptions, // Total général
        activeSubscriptions, // Subscriptions actuellement actives
        statusBreakdown: stats, // Répartition détaillée par statut
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};