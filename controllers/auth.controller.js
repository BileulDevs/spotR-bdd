const logger = require('../config/logger');
const User = require('../models/user');

exports.checkUserForLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const userCheck = await User.findOne({ email: email }).populate('subscription');

    if (!userCheck) {
      logger.info(`No user found for login with email: ${email}`);
      return res.status(404).json({ message: 'No user found with this email' });
    }

    logger.info(`User found for login: ${userCheck._id}`);
    res.status(200).json(userCheck);
  } catch (error) {
    logger.error(`Erreur : ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
