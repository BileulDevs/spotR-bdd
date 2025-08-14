const logger = require('../config/logger');
const Post = require('../models/post');

/**
 * Recherche des posts par tag spécifique
 * Endpoint: GET /api/search/tag/:tag
 * 
 * Utilise l'opérateur MongoDB $in pour chercher dans le tableau de tags
 * Retourne tous les posts qui contiennent le tag recherché
 * 
 * @param {Object} req - Request contenant le tag dans req.params.tag
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Liste des posts avec ce tag ou erreur 500
 * 
 * @example
 * GET /api/search/tag/BMW
 * Retourne tous les posts tagués avec "BMW"
 */
exports.searchByTag = async (req, res) => {
  try {
    const tag = req.params.tag; // Récupération du tag depuis l'URL

    // Recherche MongoDB : trouve tous les posts où le tableau 'tags' contient le tag recherché
    // $in : opérateur MongoDB qui vérifie si une valeur est présente dans un tableau
    const postWithThisTag = await Post.find({ tags: { $in: [tag] } }).populate(
      'user' // Chargement des informations de l'utilisateur qui a créé chaque post
    );

    res.status(200).json(postWithThisTag);
  } catch (error) {
    // Log de l'erreur pour debugging
    logger.error(`Erreur : ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};