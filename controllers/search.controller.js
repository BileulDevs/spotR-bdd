const logger = require('../config/logger');
const Post = require('../models/post');

exports.searchByTag = async (req, res) => {
  try {
    const tag = req.params.tag;

    const postWithThisTag = await Post.find({ tags: { $in: [tag] } }).populate(
      'user'
    );

    res.status(200).json(postWithThisTag);
  } catch (error) {
    logger.error(`Erreur : ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
