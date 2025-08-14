const logger = require('../config/logger');
const Premium = require('../models/premium');

/**
 * Récupère tous les abonnements premium disponibles
 * Endpoint: GET /api/premiums
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Liste complète des offres premium ou erreur 500
 */
exports.getAllPremiums = async (req, res) => {
  try {
    const premiums = await Premium.find(); // Récupération sans filtre
    res.status(200).json(premiums);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des premiums',
      error: error.message,
    });
  }
};

/**
 * Récupère un abonnement premium spécifique par son ID
 * Endpoint: GET /api/premiums/:id
 * 
 * @param {Object} req - Request contenant l'ID dans req.params.id
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Données du premium ou erreur 404/500
 */
exports.getPremiumById = async (req, res) => {
  try {
    const premium = await Premium.findById(req.params.id);

    // Vérification de l'existence du premium
    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé',
      });
    }

    res.status(200).json(premium);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du premium',
      error: error.message,
    });
  }
};

/**
 * Crée une nouvelle offre premium
 * Endpoint: POST /api/premiums
 * Body: Données de l'offre premium (nom, prix, fonctionnalités, etc.)
 * 
 * @param {Object} req - Request contenant les données premium dans req.body
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Premium créé (201) ou erreur de validation (400)
 */
exports.createPremium = async (req, res) => {
  try {
    const premium = new Premium(req.body);
    const savedPremium = await premium.save();

    res.status(201).json(savedPremium);
  } catch (error) {
    // Erreur 400 pour les erreurs de validation du modèle
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du premium',
      error: error.message,
    });
  }
};

/**
 * Met à jour complètement un premium existant (remplace toutes les données)
 * Endpoint: PUT /api/premiums/:id
 * Body: Nouvelles données complètes du premium
 * 
 * @param {Object} req - Request contenant l'ID et les nouvelles données
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Premium mis à jour ou erreur 404/400
 */
exports.updatePremium = async (req, res) => {
  try {
    const premium = await Premium.findByIdAndUpdate(req.params.id, req.body, {
      new: true,        // Retourne le document mis à jour
      runValidators: true, // Exécute les validations du schéma Mongoose
    });

    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé',
      });
    }

    res.status(200).json(premium);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du premium',
      error: error.message,
    });
  }
};

/**
 * Met à jour partiellement un premium (modifie seulement les champs fournis)
 * Endpoint: PATCH /api/premiums/:id
 * Body: Champs à modifier uniquement
 * 
 * Différence avec PUT : 
 * - PUT remplace tout l'objet
 * - PATCH modifie seulement les champs spécifiés avec $set
 * 
 * @param {Object} req - Request contenant l'ID et les champs à modifier
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Premium partiellement mis à jour ou erreur 404/400
 */
exports.patchPremium = async (req, res) => {
  try {
    const premium = await Premium.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // $set MongoDB : modifie seulement les champs fournis
      {
        new: true,
        runValidators: true,
      }
    );

    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé',
      });
    }

    res.status(200).json(premium);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour partielle du premium',
      error: error.message,
    });
  }
};

/**
 * Supprime définitivement un premium
 * Endpoint: DELETE /api/premiums/:id
 * 
 * ATTENTION: Suppression définitive, pas de soft delete
 * Considérer l'impact sur les utilisateurs ayant cet abonnement
 * 
 * @param {Object} req - Request contenant l'ID du premium à supprimer
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Premium supprimé ou erreur 404/500
 */
exports.deletePremium = async (req, res) => {
  try {
    const premium = await Premium.findByIdAndDelete(req.params.id);

    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé',
      });
    }

    // Retourne l'objet supprimé pour confirmation
    res.status(200).json(premium);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du premium',
      error: error.message,
    });
  }
};