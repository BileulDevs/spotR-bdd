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
    const posts = await Post.find().populate('user'); // .populate('user') si tu veux inclure les infos utilisateur
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