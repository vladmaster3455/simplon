const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('./middleware');
const { upload, cloudinary } = require('../config/cloudinary'); // ✅ Cloudinary

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'minibank_secret_key';

// ==================== INSCRIPTION AGENT ====================
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.email || !userData.motDePasse || !userData.nom || !userData.prenom) {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(400).json({ message: 'Données obligatoires manquantes' });
    }

    if (userData.typeUtilisateur !== 'Agent') {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(400).json({ message: 'Cette route est uniquement destinée à la création d\'un Agent' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: userData.email }, { nCarteIdentite: userData.nCarteIdentite }] 
    });
    
    if (existingUser) {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(400).json({ message: 'Un utilisateur avec cet email ou numéro de carte d\'identité existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(userData.motDePasse, 10);
    const photoPath = req.file ? req.file.path : undefined; // ✅ Cloudinary URL

    const newUser = new User({
      ...userData,
      motDePasse: hashedPassword,
      photo: photoPath,
      typeUtilisateur: 'Agent',
      dateCreation: new Date()
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.motDePasse;
    delete userResponse.activeTokens;
    delete userResponse.passwordReset;

    res.status(201).json({ 
      message: 'Agent créé avec succès', 
      user: userResponse 
    });
  } catch (error) {
    if (req.file && req.file.public_id) {
      await cloudinary.uploader.destroy(req.file.public_id);
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== CONNEXION ====================
router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email, estActif: true });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, typeUtilisateur: user.typeUtilisateur },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const tokenData = {
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deviceInfo: req.get('User-Agent') || 'Unknown'
    };

    user.activeTokens.push(tokenData);
    user.dateDerniereConnexion = new Date();
    await user.save();

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        typeUtilisateur: user.typeUtilisateur,
        photo: user.photo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== DÉCONNEXION ====================
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const token = req.token;

    user.activeTokens = user.activeTokens.filter(t => t.token !== token);
    await user.save();

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== MODIFIER PROFIL AGENT ====================
router.put('/profile', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { prenom, nom, tel, adresse, dateNaissance, email, motDePasse } = req.body;

    const agent = await User.findById(req.user._id);
    if (!agent) {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (agent.typeUtilisateur !== 'Agent') {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(403).json({ message: 'Cette route est réservée aux agents' });
    }

    // Vérifier l'unicité de l'email
    if (email && email !== agent.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: agent._id } });
      if (emailExists) {
        if (req.file && req.file.public_id) {
          await cloudinary.uploader.destroy(req.file.public_id);
        }
        return res.status(400).json({ message: 'Cet email existe déjà' });
      }
      agent.email = email;
    }

    // Vérifier l'unicité du téléphone
    if (tel && tel !== agent.tel) {
      const telExists = await User.findOne({ tel, _id: { $ne: agent._id } });
      if (telExists) {
        if (req.file && req.file.public_id) {
          await cloudinary.uploader.destroy(req.file.public_id);
        }
        return res.status(400).json({ message: 'Ce numéro de téléphone existe déjà' });
      }
      agent.tel = tel;
    }

    // Mettre à jour les informations
    if (prenom) agent.prenom = prenom;
    if (nom) agent.nom = nom;
    if (adresse) agent.adresse = adresse;
    if (dateNaissance) agent.dateNaissance = new Date(dateNaissance);

    // Mettre à jour le mot de passe
    if (motDePasse) {
      const hashedPassword = await bcrypt.hash(motDePasse, 12);
      agent.motDePasse = hashedPassword;
    }

    // ✅ Gérer la nouvelle photo avec Cloudinary
    if (req.file) {
      // Supprimer l'ancienne photo sur Cloudinary
      if (agent.photo) {
        try {
          const publicId = agent.photo.split('/').pop().split('.')[0];
          const folder = agent.photo.includes('minibank/photos') ? 'minibank/photos/' : '';
          await cloudinary.uploader.destroy(`${folder}${publicId}`);
        } catch (err) {
          console.log('Erreur suppression ancienne photo:', err.message);
        }
      }
      agent.photo = req.file.path; // ✅ URL Cloudinary complète
    }

    await agent.save();

    const agentData = agent.toObject();
    delete agentData.motDePasse;
    delete agentData.activeTokens;
    delete agentData.passwordReset;

    res.json({
      message: 'Profil mis à jour avec succès',
      user: agentData
    });

  } catch (error) {
    if (req.file && req.file.public_id) {
      await cloudinary.uploader.destroy(req.file.public_id);
    }
    console.error('Erreur modification profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== RÉCUPÉRER PROFIL ====================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-motDePasse -activeTokens -passwordReset');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({
      message: 'Profil récupéré avec succès',
      user
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ==================== SUPPRIMER PHOTO ====================
router.delete('/profile/photo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (!user.photo) {
      return res.status(400).json({ message: 'Aucune photo à supprimer' });
    }

    // ✅ Supprimer sur Cloudinary
    try {
      const publicId = user.photo.split('/').pop().split('.')[0];
      const folder = user.photo.includes('minibank/photos') ? 'minibank/photos/' : '';
      await cloudinary.uploader.destroy(`${folder}${publicId}`);
    } catch (err) {
      console.log('Erreur suppression photo:', err.message);
    }

    user.photo = undefined;
    await user.save();

    res.json({
      message: 'Photo supprimée avec succès'
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;