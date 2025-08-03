const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token manquant ou invalide.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Vous devez être administrateur"
      })
    } else {
      next();
    }
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré.' });
  }
};

module.exports = isAdmin;