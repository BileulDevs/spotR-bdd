const Post = require('../models/post');

/**
 * Crée une nouvelle publication
 * Attache automatiquement l'ID de l'utilisateur authentifié au post
 * 
 * @param {Object} req - Request contenant les données du post dans req.body et l'utilisateur dans req.user
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Renvoie le post créé ou une erreur
 */
exports.createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    post.user = req.user.id; // Attribution automatique de l'utilisateur connecté
    const saved = await post.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Récupère tous les posts avec les informations utilisateur
 * Utilise populate pour charger les détails de l'utilisateur associé
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Renvoie la liste complète des posts
 */
exports.getAllPosts = async (req, res) => {
  try {
    // .where() semble être un reliquat - pas d'effet ici
    const posts = await Post.find().where().populate('user');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Récupère un post spécifique par son ID
 * Inclut les informations de l'utilisateur qui l'a créé
 * 
 * @param {Object} req - Request contenant l'ID dans req.params.id
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Renvoie le post ou erreur 404 si non trouvé
 */
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Met à jour un post existant
 * Utilise findByIdAndUpdate avec validation et retour du document modifié
 * 
 * @param {Object} req - Request contenant l'ID et les nouvelles données
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Renvoie le post mis à jour ou erreur
 */
exports.updatePost = async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,        // Retourne le document mis à jour
      runValidators: true, // Exécute les validations du schema
    });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Supprime un post
 * Suppression définitive du post de la base de données
 * 
 * @param {Object} req - Request contenant l'ID du post à supprimer
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Confirme la suppression ou erreur 404
 */
exports.deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Système de like/unlike pour les posts
 * Toggle : ajoute ou retire un like selon l'état actuel
 * Maintient un compteur de likes et une liste des utilisateurs qui ont liké
 * 
 * @param {Object} req - Request contenant l'ID du post et l'ID utilisateur dans req.body.hasLiked
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Retourne le nouveau état des likes
 */
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.body.hasLiked; // ID de l'utilisateur qui like

    if (!userId) {
      return res.status(400).json({ error: 'ID manquant pour like' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Vérification si l'utilisateur a déjà liké ce post
    const index = post.whoLiked.indexOf(userId);

    if (index !== -1) {
      // Unlike : retirer le like
      post.whoLiked.splice(index, 1);
      post.likes = post.likes > 0 ? post.likes - 1 : 0; // Évite les valeurs négatives
    } else {
      // Like : ajouter le like
      post.whoLiked.push(userId);
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();

    res.status(200).json({
      message: 'Like mis à jour avec succès',
      likes: post.likes,
      whoLiked: post.whoLiked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Génère un feed personnalisé pour l'utilisateur
 * - Pour les utilisateurs non connectés : feed chronologique simple
 * - Pour les utilisateurs connectés : algorithme de recommandation basé sur leurs préférences
 * Supporte la pagination avec offset/limit
 * 
 * @param {Object} req - Request contenant l'utilisateur et les params de pagination
 * @param {Object} res - Response Express
 * @returns {Promise<void>} Renvoie le feed personnalisé ou générique
 */
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { offset = 0, limit = 50 } = req.query;

    // Conversion et validation des paramètres de pagination
    const offsetNum = parseInt(offset, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100); // Limite max de 100

    // Feed pour utilisateurs non connectés : posts récents uniquement
    if (!userId) {
      const posts = await Post.find({ isDeactivated: false })
        .populate('user')
        .sort({ createdAt: -1 }) // Plus récent en premier
        .skip(offsetNum)
        .limit(limitNum);

      const transformedPosts = posts.map((post) => post.toJSON());
      return res.json(transformedPosts);
    }

    // Feed personnalisé pour utilisateurs connectés
    const userProfile = await getUserProfile(userId);
    const personalizedPosts = await generatePersonalizedFeed(
      userId,
      userProfile,
      offsetNum,
      limitNum
    );

    // Tri final par date de création (plus récent en premier)
    const sortedPosts = personalizedPosts.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedPosts);
  } catch (err) {
    console.error('Erreur dans getFeed:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Analyse le profil utilisateur pour déterminer ses préférences
 * Calcule des scores basés sur :
 * - Les posts qu'il a créés (poids 2x)
 * - Les posts qu'il a likés (poids 1x)
 * Analyse les tags et marques préférés
 * 
 * @param {string} userId - ID de l'utilisateur à analyser
 * @returns {Promise<Object>} Profil avec tags/marques préférés et leurs scores
 */
async function getUserProfile(userId) {
  try {
    // Récupération des posts créés par l'utilisateur
    const userPosts = await Post.find({
      user: userId,
      isDeactivated: false,
    });

    // Récupération des posts likés par l'utilisateur
    const likedPosts = await Post.find({
      whoLiked: userId,
      isDeactivated: false,
    });

    const userPostsJSON = userPosts.map((post) => post.toJSON());
    const likedPostsJSON = likedPosts.map((post) => post.toJSON());

    // Calcul des scores pour les tags (posts propres = poids 2)
    const userTags = userPostsJSON.reduce((tags, post) => {
      if (post.tags) {
        post.tags.forEach((tag) => {
          tags[tag] = (tags[tag] || 0) + 2;
        });
      }
      return tags;
    }, {});

    // Calcul des scores pour les tags (posts likés = poids 1)
    const likedTags = likedPostsJSON.reduce((tags, post) => {
      if (post.tags) {
        post.tags.forEach((tag) => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
      return tags;
    }, {});

    // Fusion des scores de tags
    const allTags = { ...userTags };
    Object.keys(likedTags).forEach((tag) => {
      allTags[tag] = (allTags[tag] || 0) + likedTags[tag];
    });

    // Même logique pour les marques de voitures
    const userBrands = userPostsJSON.reduce((brands, post) => {
      if (post.brand) {
        brands[post.brand] = (brands[post.brand] || 0) + 2;
      }
      return brands;
    }, {});

    const likedBrands = likedPostsJSON.reduce((brands, post) => {
      if (post.brand) {
        brands[post.brand] = (brands[post.brand] || 0) + 1;
      }
      return brands;
    }, {});

    const allBrands = { ...userBrands };
    Object.keys(likedBrands).forEach((brand) => {
      allBrands[brand] = (allBrands[brand] || 0) + likedBrands[brand];
    });

    return {
      // Tags triés par score décroissant
      preferredTags: Object.keys(allTags).sort(
        (a, b) => allTags[b] - allTags[a]
      ),
      tagScores: allTags,
      // Marques triées par score décroissant
      preferredBrands: Object.keys(allBrands).sort(
        (a, b) => allBrands[b] - allBrands[a]
      ),
      brandScores: allBrands,
      totalUserPosts: userPostsJSON.length,
      totalLikedPosts: likedPostsJSON.length,
    };
  } catch (error) {
    console.error("Erreur lors de l'analyse du profil utilisateur:", error);
    // Profil par défaut en cas d'erreur
    return {
      preferredTags: [],
      tagScores: {},
      preferredBrands: [],
      brandScores: {},
      totalUserPosts: 0,
      totalLikedPosts: 0,
    };
  }
}

/**
 * Récupère des posts aléatoires avec pagination
 * Utilisé comme fallback quand l'algorithme de personnalisation échoue
 * Utilise l'aggregation MongoDB pour optimiser les performances
 * 
 * @param {string} userId - ID utilisateur (pour exclure ses propres posts)
 * @param {number} limit - Nombre de posts à récupérer
 * @param {number} offset - Nombre de posts à ignorer
 * @returns {Promise<Array>} Liste des posts aléatoires
 */
async function getRandomPosts(userId, limit = 50, offset = 0) {
  try {
    const posts = await Post.aggregate([
      {
        // Filtrage : posts actifs et pas de l'utilisateur courant
        $match: {
          isDeactivated: false,
          user: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      { $sort: { createdAt: -1 } }, // Tri par date
      { $skip: offset },             // Pagination
      { $limit: limit },
      {
        // Join avec la collection users
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user', // Conversion array -> objet
      },
      {
        // Ajout de champs pour compatibilité JSON
        $addFields: {
          id: '$_id',
          'user.id': '$user._id',
        },
      },
      {
        // Suppression des champs internes MongoDB
        $project: {
          _id: 0,
          __v: 0,
          'user._id': 0,
          'user.__v': 0,
        },
      },
    ]);

    return posts;
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des posts aléatoires:',
      error
    );

    // Fallback avec requête Mongoose classique
    const posts = await Post.find({
      isDeactivated: false,
      user: { $ne: userId },
    })
      .populate('user')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return posts.map((post) => post.toJSON());
  }
}

/**
 * Génère un feed personnalisé basé sur l'algorithme de recommandation
 * Utilise un système de scoring multicritères :
 * - Correspondance tags (40% du score)
 * - Correspondance marque (30% du score)  
 * - Popularité/likes (20% du score)
 * - Récence (10% du score)
 * 
 * Pour les nouveaux utilisateurs : mélange avec des posts populaires
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil de préférences de l'utilisateur
 * @param {number} offset - Offset pour la pagination
 * @param {number} limit - Limite de posts à retourner
 * @returns {Promise<Array>} Feed personnalisé trié par pertinence
 */
async function generatePersonalizedFeed(
  userId,
  userProfile,
  offset = 0,
  limit = 50
) {
  try {
    // Récupération d'un pool plus large pour avoir plus de choix à scorer
    const totalPostsToAnalyze = Math.max(200, offset + limit * 2);

    const posts = await Post.find({
      isDeactivated: false,
      user: { $ne: userId }, // Exclure les posts de l'utilisateur
    })
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(totalPostsToAnalyze);

    if (posts.length === 0) {
      console.log('Aucun post disponible, récupération de posts aléatoires');
      return await getRandomPosts(userId, limit, offset);
    }

    const postsJSON = posts.map((post) => post.toJSON());

    // Calcul du score de pertinence pour chaque post
    const scoredPosts = postsJSON.map((post) => {
      let score = 0;

      // Score basé sur les tags (40% du poids total)
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (userProfile.tagScores[tag]) {
            score += userProfile.tagScores[tag] * 0.4;
          }
        });
      }

      // Score basé sur la marque (30% du poids total)
      if (post.brand && userProfile.brandScores[post.brand]) {
        score += userProfile.brandScores[post.brand] * 0.3;
      }

      // Score basé sur la popularité (20% du poids total)
      const likes = post.likes || 0;
      score += Math.log(likes + 1) * 0.2; // Log pour éviter que les posts très populaires dominent

      // Score de récence (10% du poids total)
      const daysSinceCreation =
        (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 7 - daysSinceCreation) / 7; // Posts de moins de 7 jours favorisés
      score += recencyScore * 0.1;

      return {
        ...post,
        relevanceScore: score,
      };
    });

    // Tri par score de pertinence et application de la pagination
    let sortedPosts = scoredPosts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(offset, offset + limit);

    // Stratégie spéciale pour les nouveaux utilisateurs (peu d'historique)
    if (
      offset === 0 && // Seulement pour la première page
      userProfile.totalUserPosts < 3 &&
      userProfile.totalLikedPosts < 5
    ) {
      // Récupération des posts les plus populaires
      const popularPostsDoc = await Post.find({
        isDeactivated: false,
        user: { $ne: userId },
      })
        .populate('user')
        .sort({ likes: -1, createdAt: -1 }) // Tri par likes puis par date
        .limit(Math.floor(limit / 2));

      const popularPosts = popularPostsDoc.map((post) => post.toJSON());

      // Mélange : 50% posts personnalisés + 50% posts populaires
      const halfLimit = Math.floor(limit / 2);
      const mixedPosts = [...sortedPosts.slice(0, halfLimit), ...popularPosts]
        .reduce((unique, post) => {
          // Suppression des doublons
          if (!unique.find((p) => p.id === post.id)) {
            unique.push(post);
          }
          return unique;
        }, [])
        .slice(0, limit);

      sortedPosts = mixedPosts;
    }

    // Fallback si aucun résultat
    if (sortedPosts.length === 0) {
      console.log('Feed personnalisé vide, récupération de posts aléatoires');
      return await getRandomPosts(userId, limit, offset);
    }

    // Nettoyage : suppression du score de pertinence avant retour
    return sortedPosts.map((post) => {
      const { relevanceScore, ...cleanPost } = post;
      return cleanPost;
    });
  } catch (error) {
    console.error('Erreur lors de la génération du feed personnalisé:', error);
    return await getRandomPosts(userId, limit, offset);
  }
}