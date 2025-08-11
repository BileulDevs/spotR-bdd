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
    const userId = req.user?.id;
    const { offset = 0, limit = 50 } = req.query;
    
    const offsetNum = parseInt(offset, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    
    if (!userId) {
      const posts = await Post.find({ isDeactivated: false })
        .populate('user')
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum);
      
      const transformedPosts = posts.map(post => post.toJSON());
      return res.json(transformedPosts);
    }

    const userProfile = await getUserProfile(userId);
    const personalizedPosts = await generatePersonalizedFeed(userId, userProfile, offsetNum, limitNum);
    
    const sortedPosts = personalizedPosts.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedPosts);
  } catch (err) {
    console.error('Erreur dans getFeed:', err);
    res.status(500).json({ error: err.message });
  }
};

// Fonction pour analyser le profil utilisateur
async function getUserProfile(userId) {
  try {
    const userPosts = await Post.find({ 
      user: userId, 
      isDeactivated: false 
    });

    const likedPosts = await Post.find({ 
      whoLiked: userId, 
      isDeactivated: false 
    });

    const userPostsJSON = userPosts.map(post => post.toJSON());
    const likedPostsJSON = likedPosts.map(post => post.toJSON());

    const userTags = userPostsJSON.reduce((tags, post) => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 2;
        });
      }
      return tags;
    }, {});

    const likedTags = likedPostsJSON.reduce((tags, post) => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
      return tags;
    }, {});

    const allTags = { ...userTags };
    Object.keys(likedTags).forEach(tag => {
      allTags[tag] = (allTags[tag] || 0) + likedTags[tag];
    });

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
    Object.keys(likedBrands).forEach(brand => {
      allBrands[brand] = (allBrands[brand] || 0) + likedBrands[brand];
    });

    return {
      preferredTags: Object.keys(allTags).sort((a, b) => allTags[b] - allTags[a]),
      tagScores: allTags,
      preferredBrands: Object.keys(allBrands).sort((a, b) => allBrands[b] - allBrands[a]),
      brandScores: allBrands,
      totalUserPosts: userPostsJSON.length,
      totalLikedPosts: likedPostsJSON.length
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

// Fonction pour récupérer des posts aléatoires avec pagination
async function getRandomPosts(userId, limit = 50, offset = 0) {
  try {
    const posts = await Post.aggregate([
      { 
        $match: { 
          isDeactivated: false,
          user: { $ne: new mongoose.Types.ObjectId(userId) }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $addFields: {
          id: '$_id',
          'user.id': '$user._id'
        }
      },
      {
        $project: {
          _id: 0,
          '__v': 0,
          'user._id': 0,
          'user.__v': 0
        }
      }
    ]);

    return posts;
  } catch (error) {
    console.error('Erreur lors de la récupération des posts aléatoires:', error);

    const posts = await Post.find({ 
      isDeactivated: false,
      user: { $ne: userId }
    })
    .populate('user')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);
    
    return posts.map(post => post.toJSON());
  }
}

// Fonction pour générer le feed personnalisé avec pagination
async function generatePersonalizedFeed(userId, userProfile, offset = 0, limit = 50) {
  try {
    const totalPostsToAnalyze = Math.max(200, offset + limit * 2);
    
    const posts = await Post.find({ 
      isDeactivated: false,
      user: { $ne: userId }
    })
    .populate('user')
    .sort({ createdAt: -1 })
    .limit(totalPostsToAnalyze);

    if (posts.length === 0) {
      console.log('Aucun post disponible, récupération de posts aléatoires');
      return await getRandomPosts(userId, limit, offset);
    }

    const postsJSON = posts.map(post => post.toJSON());

    const scoredPosts = postsJSON.map(post => {
      let score = 0;

      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (userProfile.tagScores[tag]) {
            score += userProfile.tagScores[tag] * 0.4;
          }
        });
      }

      if (post.brand && userProfile.brandScores[post.brand]) {
        score += userProfile.brandScores[post.brand] * 0.3;
      }

      const likes = post.likes || 0;
      score += Math.log(likes + 1) * 0.2;

      const daysSinceCreation = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 7 - daysSinceCreation) / 7;
      score += recencyScore * 0.1;

      return {
        ...post,
        relevanceScore: score
      };
    });

    let sortedPosts = scoredPosts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(offset, offset + limit);

    if (offset === 0 && userProfile.totalUserPosts < 3 && userProfile.totalLikedPosts < 5) {
      const popularPostsDoc = await Post.find({ 
        isDeactivated: false,
        user: { $ne: userId }
      })
      .populate('user')
      .sort({ likes: -1, createdAt: -1 })
      .limit(Math.floor(limit / 2));

      const popularPosts = popularPostsDoc.map(post => post.toJSON());

      const halfLimit = Math.floor(limit / 2);
      const mixedPosts = [
        ...sortedPosts.slice(0, halfLimit), 
        ...popularPosts
      ]
        .reduce((unique, post) => {
          if (!unique.find(p => p.id === post.id)) {
            unique.push(post);
          }
          return unique;
        }, [])
        .slice(0, limit);

      sortedPosts = mixedPosts;
    }

    if (sortedPosts.length === 0) {
      console.log('Feed personnalisé vide, récupération de posts aléatoires');
      return await getRandomPosts(userId, limit, offset);
    }

    return sortedPosts.map(post => {
      const { relevanceScore, ...cleanPost } = post;
      return cleanPost;
    });

  } catch (error) {
    console.error('Erreur lors de la génération du feed personnalisé:', error);
    return await getRandomPosts(userId, limit, offset);
  }
}