const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const uploadRoutes = require('./routes/upload'); 

const app = express();

// Middlewares
app.use(express.json());

// CORS dynamique pour production
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origin est autorisée
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins[0] === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// SERVIR LES FICHIERS STATIQUES (photos)
app.use('/serge/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const API_PREFIX = process.env.API_PREFIX || '/serge';

// Vérification des variables d'environnement critiques
if (!MONGODB_URI) {
  console.error('ERREUR: MONGODB_URI non défini dans .env');
  process.exit(1);
}

// Connexion MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log(' Connexion MongoDB réussie'))
  .catch(err => {
    console.error(' Erreur connexion MongoDB:', err);
    process.exit(1);
  });

// Routes avec préfixe dynamique
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes); 

// Route de test
app.get(`${API_PREFIX}/test`, (req, res) => {
  res.json({ 
    message: 'API MiniBank fonctionne correctement !',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route non trouvée',
    path: req.originalUrl 
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(' Erreur serveur:', err);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(` Serveur démarré sur le port ${PORT}`);
  console.log(` API accessible via: http://localhost:${PORT}${API_PREFIX}`);
  console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(` CORS autorisé pour: ${allowedOrigins.join(', ')}`);
});

module.exports = app;