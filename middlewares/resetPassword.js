const jwt = require('jsonwebtoken');

const resetPassword = (req, res, next) => {
  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        message: 'Token invalide',
      });
    }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: 'Token invalide ou expiré.' });
  }
};

module.exports = resetPassword;
