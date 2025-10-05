const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'minibank_secret_key';

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.estActif) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou inactif' });
    }

    // Vérifier si le token est dans la liste des tokens actifs
    const tokenExists = user.activeTokens.find(t => t.token === token);
    if (!tokenExists) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide' });
  }
};

module.exports = {
  authenticateToken
};