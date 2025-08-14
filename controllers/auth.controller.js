const logger = require('../config/logger');
const User = require('../models/user');

/**
 * Vérifie l'existence d'un utilisateur pour le processus de connexion
 * Utilisé avant la validation du mot de passe pour s'assurer que l'utilisateur existe
 * 
 * Endpoint: POST /api/auth/checkUser
 * Body: { email: "user@example.com" }
 * 
 * @param {Object} req - Objet request Express contenant l'email dans req.body
 * @param {Object} res - Objet response Express
 * @returns {Promise<void>} Renvoie les données utilisateur ou une erreur 404/500
 */
exports.checkUserForLogin = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Recherche de l'utilisateur par email avec population de la relation subscription
    // .populate('subscription') charge les détails de l'abonnement de l'utilisateur
    const userCheck = await User.findOne({ email: email }).populate('subscription');

    // Si aucun utilisateur trouvé avec cet email
    if (!userCheck) {
      logger.info(`No user found for login with email: ${email}`);
      return res.status(404).json({ message: 'No user found with this email' });
    }

    // Log de succès avec l'ID utilisateur (pas l'email pour la confidentialité)
    logger.info(`User found for login: ${userCheck._id}`);
    
    // Retour des données complètes de l'utilisateur (incluant subscription)
    // ATTENTION: Cela inclut potentiellement des données sensibles comme le mot de passe hashé
    res.status(200).json(userCheck);
  } catch (error) {
    // Log et retour de l'erreur en cas d'exception (problème DB, etc.)
    logger.error(`Erreur : ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};