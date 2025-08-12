const logger = require('../config/logger');
const Subscription = require('../models/subscription');
const Premium = require('../models/premium');
const User = require('../models/user');

// GET - Récupérer toutes les subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId')
      .populate('premium', 'title tarif description');
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des subscriptions',
      error: error.message,
    });
  }
};

// GET - Récupérer une subscription par ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId')
      .populate('premium', 'title tarif description');

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

// GET - Récupérer les subscriptions d'un utilisateur
exports.getSubscriptionsByUser = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.params.userId })
      .populate('premium', 'title tarif description')
      .sort({ createdAt: -1 });

    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération des subscriptions de l'utilisateur",
      error: error.message,
    });
  }
};

// GET - Récupérer les subscriptions actives d'un utilisateur
exports.getActiveSubscriptionsByUser = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.params.userId,
      status: 'active',
      endDate: { $gt: new Date() },
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

// POST - Créer une nouvelle subscription
exports.createSubscription = async (req, res) => {
  try {
    const { userId, premiumId, duration = 30 } = req.body;
    // Vérifier si le Id existe
    const premium = await Premium.findById(premiumId);
    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé',
      });
    }

    // Calculer la date de fin
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const subscriptionData = {
      ...req.body,
      premium,
      startDate,
      endDate,
      amount: premium.tarif,
    };

    const subscription = new Subscription(subscriptionData);
    const savedSubscription = await subscription.save();

    logger.info(`Creating sub : ${savedSubscription._id}`);

    await User.findByIdAndUpdate(userId, { subscription: savedSubscription });
    await Premium.findByIdAndUpdate(premium, { $inc: { subCount: 1 } });

    const populatedSubscription = await Subscription.findById(
      savedSubscription._id
    )
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

// PUT - Mettre à jour une subscription par ID
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
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
      message: 'Erreur lors de la mise à jour de la subscription',
      error: error.message,
    });
  }
};

// PATCH - Mise à jour partielle d'une subscription
exports.patchSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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

// PATCH - Annuler une subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        autoRenew: false,
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

// PATCH - Renouveler une subscription
exports.renewSubscription = async (req, res) => {
  try {
    const { duration = 30 } = req.body;

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    // Calculer la nouvelle date de fin
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        endDate: newEndDate,
        status: 'active',
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

// DELETE - Supprimer une subscription par ID
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription non trouvée',
      });
    }

    // Décrémenter le compteur de subscriptions du premium
    await Premium.findByIdAndUpdate(subscription.premium, {
      $inc: { subCount: -1 },
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

// GET - Recherche avec pagination et filtres
exports.searchSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      premium,
      startDate,
      endDate,
      ...filters
    } = req.query;

    const searchFilters = { ...filters };

    if (status) searchFilters.status = status;
    if (userId) searchFilters.userId = userId;
    if (premium) searchFilters.premium = premium;

    if (startDate || endDate) {
      searchFilters.createdAt = {};
      if (startDate) searchFilters.createdAt.$gte = new Date(startDate);
      if (endDate) searchFilters.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'premium', select: 'title tarif description' },
      ],
    };

    const subscriptions = await Subscription.find(searchFilters)
      .populate('userId', 'name email')
      .populate('premium', 'title tarif description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Subscription.countDocuments(searchFilters);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
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

// GET - Statistiques des subscriptions
exports.getSubscriptionStats = async (req, res) => {
  try {
    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: 'active',
      endDate: { $gt: new Date() },
    });

    res.status(200).json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        statusBreakdown: stats,
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
