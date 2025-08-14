/**
 * CONTRÔLEUR DE GESTION DES UTILISATEURS
 * Ce fichier contient toutes les fonctions CRUD pour la gestion des utilisateurs
 * Supporte l'authentification locale et via providers externes
 * Utilise MongoDB avec Mongoose pour les opérations de base de données
 */

// Importation des utilitaires de sécurité et configuration
const cryptPassword = require('../helpers/cryptPassword'); // Helper pour hasher les mots de passe
const comparePassword = require('../helpers/comparePassword'); // Helper pour comparer les mots de passe
const logger = require('../config/logger'); // Configuration du logger
const User = require('../models/user'); // Modèle Mongoose pour les utilisateurs
const Post = require('../models/post'); // Modèle Mongoose pour les posts

/**
 * POST /users
 * Crée un nouveau utilisateur avec gestion des providers d'authentification
 * Supporte l'inscription locale (avec mot de passe) et via providers externes
 * @param {Object} req - Objet de requête Express (username, email, password, provider)
 * @param {Object} res - Objet de réponse Express
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, provider } = req.body;

    // Vérification de l'unicité du nom d'utilisateur
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res
        .status(400)
        .json({ message: "Nom d'utilisateur déjà utilisé" });
    }

    let hashedPassword = undefined;

    // Gestion différenciée selon le provider d'authentification
    if (provider === 'local') {
      // Pour l'authentification locale, le mot de passe est obligatoire
      if (!password) {
        return res
          .status(400)
          .json({ message: 'Password is required for local provider' });
      }
      hashedPassword = await cryptPassword(password); // Hachage sécurisé du mot de passe
    }
    // Pour les providers externes (Google, Facebook, etc.), pas de mot de passe requis

    // Création de l'utilisateur avec mot de passe haché (si applicable)
    const user = new User({
      username,
      email,
      provider, // Type d'authentification (local, google, facebook, etc.)
      password: hashedPassword, // undefined pour les providers externes
    });

    await user.save();

    // Récupération de l'utilisateur avec ses données de subscription
    const populatedUser = await User.findById(user._id).populate('subscription');

    logger.info(`User created: ${user._id}`);
    res.status(201).json(populatedUser);
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /users
 * Récupère la liste de tous les utilisateurs avec leurs subscriptions
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').populate('subscription');

    res.json(users);
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /users/:id
 * Récupère un utilisateur spécifique par son ID
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('subscription');
    
    if (!user) {
      logger.warn(`User not found: ${req.params.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Fetched user: ${user._id}`);
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /users/username/:username
 * Récupère un utilisateur par son nom d'utilisateur
 * Alternative à la recherche par ID pour les URLs conviviales
 * @param {Object} req - Objet de requête Express (contient req.params.username)
 * @param {Object} res - Objet de réponse Express
 */
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate('subscription');
    
    if (!user) {
      logger.warn(`User not found: ${req.params.username}`);
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Fetched user: ${user.username}`);
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /users/:id/password
 * Met à jour uniquement le mot de passe d'un utilisateur
 * Le mot de passe est déjà hashé par le service auth (endpoint utilisé seulement pour le resetPassword & sécurisé par un middleware)
 * @param {Object} req - Objet de requête Express (contient password)
 * @param {Object} res - Objet de réponse Express
 */
exports.updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Vérification de l'existence de l'utilisateur
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      logger.warn(`User not found for update: ${req.params.id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // ATTENTION: Le mot de passe est stocké en clair (pas de hachage)
    // Ceci est un problème de sécurité majeur
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: password }, // Stockage en clair - VULNÉRABILITÉ
      { new: true }
    ).populate('subscription');

    logger.info(`Updated user password: ${user._id}`);

    res.status(200).send({ 
      success: true, 
      message: 'Mot de passe mis à jour avec succès' 
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

/**
 * PUT /users/:id
 * Met à jour les informations d'un utilisateur avec validations complètes
 * Gère le changement de username, mot de passe, avatar, permissions, etc.
 * @param {Object} req - Objet de requête Express (contient les champs à modifier)
 * @param {Object} res - Objet de réponse Express
 */
exports.updateUser = async (req, res) => {
  try {
    const {
      username,
      password,
      avatar,
      isAdmin,
      isEmailVerified,
      confirmPassword,
      currentPassword,
    } = req.body;
    
    const updateFields = {}; // Objet pour stocker les champs à mettre à jour

    // Vérification de l'existence de l'utilisateur
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      logger.warn(`User not found for update: ${req.params.id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // GESTION DU CHANGEMENT DE USERNAME
    if (username && username !== existingUser.username) {
      // Validation via service externe d'IA
      const response = await fetch(
        `${process.env.SERVICE_IA_URL}/api/validate/validateData`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        }
      );

      const validation = await response.json();

      // Vérification de la validation IA
      if (!validation.success) {
        logger.warn('La validation des données a échouée lors d\'une inscription');
        return res.status(400).json({
          message: 'La validation des données a échouée, veuillez vérifier vos données',
        });
      }

      // Vérification de l'unicité du nouveau username
      const usernameTaken = await User.findOne({ username });
      if (usernameTaken) {
        return res.status(400).json({ 
          message: "Nom d'utilisateur déjà utilisé" 
        });
      }
      updateFields.username = username;
    }

    // GESTION DU CHANGEMENT DE MOT DE PASSE avec validation complète
    if (password || confirmPassword || currentPassword) {
      // Vérification que tous les champs mot de passe sont fournis
      if (!password || !confirmPassword || !currentPassword) {
        return res.status(400).json({ 
          message: 'Tous les champs de mot de passe sont requis' 
        });
      }

      // Vérification de la correspondance des nouveaux mots de passe
      if (password !== confirmPassword) {
        return res.status(400).json({ 
          message: 'Les mots de passe ne correspondent pas' 
        });
      }

      // Validation du mot de passe actuel
      const isCurrentPasswordValid = await comparePassword(
        currentPassword,
        existingUser.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          message: 'Le mot de passe actuel est incorrect' 
        });
      }

      // Hachage sécurisé du nouveau mot de passe
      updateFields.password = await cryptPassword(password);
    }

    // GESTION DE L'AVATAR (peut être null/undefined)
    if (avatar !== undefined) {
      updateFields.avatar = avatar;
    }

    // GESTION DES PERMISSIONS ADMIN (seulement si l'utilisateur actuel est admin)
    if (isAdmin !== undefined && req.user.isAdmin) {
      updateFields.isAdmin = isAdmin;
    }

    // GESTION DE LA VÉRIFICATION EMAIL avec horodatage
    if (isEmailVerified !== undefined && isEmailVerified !== existingUser.isEmailVerified) {
      updateFields.isEmailVerified = isEmailVerified;

      if (isEmailVerified === true && !existingUser.isEmailVerified) {
        // Première vérification : enregistrer la date
        updateFields.emailVerifiedAt = new Date();
      } else if (isEmailVerified === false) {
        // Annulation de la vérification : supprimer la date
        updateFields.emailVerifiedAt = null;
      }
    }

    // Vérification qu'au moins un champ est à mettre à jour
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    // Mise à jour de l'utilisateur
    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true, // Retourne le document mis à jour
    }).populate('subscription');

    logger.info(`Updated user: ${user._id}`);
    
    // Suppression du mot de passe de la réponse pour la sécurité
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /users/:id
 * Supprime définitivement un utilisateur
 * ATTENTION: Pas de suppression en cascade des données liées (posts, subscriptions, etc.)
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      logger.warn(`User not found for deletion: ${req.params.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Deleted user: ${user._id}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /users/:id/verify-email
 * Marque l'email d'un utilisateur comme vérifié
 * Fonction simple sans horodatage (contrairement à updateUser)
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.verifyEmail = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isEmailVerified: true, emailVerifiedAt: new Date() });
    
    logger.info(`Email vérifié pour id : ${req.params.id}`);
    res.status(200).send({ message: 'Email vérifié.' });
  } catch (err) {
    logger.error(`Erreur lors de la vérification de l'email pour id : ${req.params.id}`);
    res.status(500).send({ message: `Error : ${err.message}` });
  }
};

/**
 * GET /users/:id/posts
 * Récupère tous les posts créés par un utilisateur spécifique
 * Utile pour afficher le profil utilisateur avec ses publications
 * @param {Object} req - Objet de requête Express (contient req.params.id)
 * @param {Object} res - Objet de réponse Express
 */
exports.getUserPosts = async (req, res) => {
  try {
    // Recherche des posts avec population des données utilisateur
    const userPosts = await Post.find({ user: req.params.id }).populate('user');
    
    res.status(200).json({ posts: userPosts });
  } catch (err) {
    logger.error(`Erreur lors de la récupération des posts pour : ${req.params.id}`);
    res.status(500).send({ message: `Error : ${err.message}` });
  }
};