const Post = require('../models/post');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    post.user = req.user.id;
    const saved = await post.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().where().populate('user');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
      const post = await Post.findById(req.params.id);
      const userId = req.body.hasLiked;

      if (!userId) {
        return res.status(400).json({ error: 'ID manquant pour like' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Post non trouvé' });
      }

      const index = post.whoLiked.indexOf(userId);

      if (index !== -1) {
        post.whoLiked.splice(index, 1);
        post.likes = post.likes > 0 ? post.likes - 1 : 0;
      } else {
        post.whoLiked.push(userId);
        post.likes = (post.likes || 0) + 1;
      }

      await post.save();

      res.status(200).json({ message: 'Like mis à jour avec succès', likes: post.likes, whoLiked: post.whoLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user?.id; // Supposant que l'utilisateur est authentifié
    
    if (!userId) {
      // Si pas d'utilisateur connecté, retourner un feed général
      const posts = await Post.find({ isDeactivated: false })
        .populate('user')
        .sort({ createdAt: -1 })
        .limit(50);
      return res.json(posts);
    }

    // Récupérer le profil utilisateur basé sur ses posts et likes
    const userProfile = await getUserProfile(userId);
    
    // Générer le feed personnalisé
    const personalizedPosts = await generatePersonalizedFeed(userId, userProfile);
    
    // Trier les posts par date de création (plus récent en premier)
    const sortedPosts = personalizedPosts.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    res.json(sortedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fonction pour analyser le profil utilisateur
async function getUserProfile(userId) {
  try {
    // Récupérer les posts de l'utilisateur pour analyser ses préférences
    const userPosts = await Post.find({ 
      user: userId, 
      isDeactivated: false 
    });

    // Récupérer les posts que l'utilisateur a likés
    const likedPosts = await Post.find({ 
      whoLiked: userId, 
      isDeactivated: false 
    });

    // Analyser les tags des posts de l'utilisateur
    const userTags = userPosts.reduce((tags, post) => {
      post.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 2; // Pondération plus forte pour ses propres posts
      });
      return tags;
    }, {});

    // Analyser les tags des posts likés
    const likedTags = likedPosts.reduce((tags, post) => {
      post.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1; // Pondération normale pour les likes
      });
      return tags;
    }, {});

    // Combiner les tags avec leurs scores
    const allTags = { ...userTags };
    Object.keys(likedTags).forEach(tag => {
      allTags[tag] = (allTags[tag] || 0) + likedTags[tag];
    });

    // Analyser les marques préférées
    const userBrands = userPosts.reduce((brands, post) => {
      brands[post.brand] = (brands[post.brand] || 0) + 2;
      return brands;
    }, {});

    const likedBrands = likedPosts.reduce((brands, post) => {
      brands[post.brand] = (brands[post.brand] || 0) + 1;
      return brands;
    }, {});

    const allBrands = { ...userBrands };
    Object.keys(likedBrands).forEach(brand => {
      allBrands[brand] = (allBrands[brand] || 0) + likedBrands[brand];
    });

    return {
      preferredTags: Object.keys(allTags).sort((a, b) => allTags[b] - allTags[a]),
      tagScores: allTags,
      preferredBrands: Object.keys(allBrands).sort((a, b) => allBrands[b] - allBrands[a]),
      brandScores: allBrands,
      totalUserPosts: userPosts.length,
      totalLikedPosts: likedPosts.length
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du profil utilisateur:', error);
    return {
      preferredTags: [],
      tagScores: {},
      preferredBrands: [],
      brandScores: {},
      totalUserPosts: 0,
      totalLikedPosts: 0
    };
  }
}

// Fonction pour récupérer des posts aléatoires
async function getRandomPosts(userId, limit = 50) {
  try {
    const posts = await Post.aggregate([
      { 
        $match: { 
          isDeactivated: false,
          user: { $ne: userId }
        }
      },
      { $sample: { size: limit } }
    ]);

    // Populer les utilisateurs pour les posts aléatoires
    const populatedPosts = await Post.populate(posts, { path: 'user' });
    
    // Trier par date de création (plus récent en premier)
    return populatedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Erreur lors de la récupération des posts aléatoires:', error);
    // Fallback sur une récupération normale si l'agrégation échoue
    return await Post.find({ 
      isDeactivated: false,
      user: { $ne: userId }
    })
    .populate('user')
    .sort({ createdAt: -1 })
    .limit(limit);
  }
}

// Fonction pour générer le feed personnalisé
async function generatePersonalizedFeed(userId, userProfile) {
  try {
    const posts = await Post.find({ 
      isDeactivated: false,
      user: { $ne: userId } // Exclure ses propres posts
    }).populate('user');

    // Si aucun post n'est disponible, retourner des posts aléatoires
    if (posts.length === 0) {
      console.log('Aucun post disponible, récupération de posts aléatoires');
      return await getRandomPosts(userId);
    }

    // Calculer un score pour chaque post
    const scoredPosts = posts.map(post => {
      let score = 0;

      // Score basé sur les tags
      post.tags.forEach(tag => {
        if (userProfile.tagScores[tag]) {
          score += userProfile.tagScores[tag] * 0.4; // 40% du score basé sur les tags
        }
      });

      // Score basé sur la marque
      if (userProfile.brandScores[post.brand]) {
        score += userProfile.brandScores[post.brand] * 0.3; // 30% du score basé sur la marque
      }

      // Score basé sur la popularité (likes)
      score += Math.log(post.likes + 1) * 0.2; // 20% basé sur les likes (log pour éviter la domination des posts très populaires)

      // Score basé sur la récence
      const daysSinceCreation = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 7 - daysSinceCreation) / 7; // Score diminue après 7 jours
      score += recencyScore * 0.1; // 10% basé sur la récence

      return {
        ...post.toObject(),
        relevanceScore: score
      };
    });

    // Trier par score de pertinence et retourner les meilleurs résultats
    let sortedPosts = scoredPosts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50); // Limiter à 50 posts

    // Si l'utilisateur a peu d'historique, mélanger avec des posts populaires récents
    if (userProfile.totalUserPosts < 3 && userProfile.totalLikedPosts < 5) {
      const popularPosts = await Post.find({ 
        isDeactivated: false,
        user: { $ne: userId }
      })
      .populate('user')
      .sort({ likes: -1, createdAt: -1 })
      .limit(25);

      // Mélanger les posts personnalisés avec les posts populaires
      const mixedPosts = [...sortedPosts.slice(0, 25), ...popularPosts]
        .reduce((unique, post) => {
          if (!unique.find(p => p.id === post.id)) {
            unique.push(post);
          }
          return unique;
        }, [])
        .slice(0, 50);

      sortedPosts = mixedPosts;
    }

    // Vérifier si le feed personnalisé est vide
    if (sortedPosts.length === 0) {
      console.log('Feed personnalisé vide, récupération de posts aléatoires');
      return await getRandomPosts(userId);
    }

    // Retirer le score de pertinence avant d'envoyer la réponse
    return sortedPosts.map(post => {
      const { relevanceScore, ...postWithoutScore } = post;
      return postWithoutScore;
    });

  } catch (error) {
    console.error('Erreur lors de la génération du feed personnalisé:', error);
    // En cas d'erreur, retourner des posts aléatoires
    console.log('Erreur dans generatePersonalizedFeed, récupération de posts aléatoires');
    return await getRandomPosts(userId);
  }
}