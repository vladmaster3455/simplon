const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('./middleware');
const { upload, cloudinary } = require('../config/cloudinary'); //  NOUVELLE VERSION
const fs = require('fs'); //  AJOUT

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'minibank_secret_key';

// ✅ MODIFIÉ : Inscription Agent avec photo optionnelle
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const userData = req.body;
    
    // Vérifier les données obligatoires
    if (!userData.email || !userData.motDePasse || !userData.nom || !userData.prenom) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Données obligatoires manquantes' });
    }

    // S'assurer que le type d'utilisateur est bien 'Agent'
    if (userData.typeUtilisateur !== 'Agent') {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Cette route est uniquement destinée à la création d\'un Agent' });
    }

    // Vérifier si un utilisateur avec cet email ou nCarteIdentite existe déjà  
    const existingUser = await User.findOne({ 
      $or: [{ email: userData.email }, { nCarteIdentite: userData.nCarteIdentite }] 
    });
    
    if (existingUser) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Un utilisateur avec cet email ou numéro de carte d\'identité existe déjà' });
    }

    // Hasher le mot de passe pour la sécurité
    const hashedPassword = await bcrypt.hash(userData.motDePasse, 10);

    // ✅ Gérer le chemin de la photo (OPTIONNEL)
    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

    const newUser = new User({
      ...userData,
      motDePasse: hashedPassword,
      photo: photoPath, // ✅ AJOUT
      typeUtilisateur: 'Agent', // Forcer le type à 'Agent'
      dateCreation: new Date()
    });

    await newUser.save();

    // Renvoyer les informations de l'agent sans les données sensibles
    const userResponse = newUser.toObject();
    delete userResponse.motDePasse;
    delete userResponse.activeTokens;
    delete userResponse.passwordReset;

    res.status(201).json({ 
      message: 'Agent créé avec succès', 
      user: userResponse 
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// CONNEXION
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

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, typeUtilisateur: user.typeUtilisateur },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Ajouter le token aux tokens actifs
    const tokenData = {
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
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
        photo: user.photo // ✅ Inclure la photo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DÉCONNEXION
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const token = req.token;

    // Supprimer le token des tokens actifs
    user.activeTokens = user.activeTokens.filter(t => t.token !== token);
    await user.save();

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ ROUTE POUR METTRE À JOUR LA PHOTO DE L'AGENT CONNECTÉ
router.put('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Aucun fichier fourni' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Supprimer l'ancienne photo si elle existe
   if (user.photo) {
  // Extraire l'ID public de l'URL Cloudinary
  const publicId = user.photo.split('/').slice(-2).join('/').split('.')[0];
  await cloudinary.uploader.destroy(publicId);
}

   user.photo = req.file.path;
    await user.save();

    res.json({
      message: 'Photo mise à jour avec succès',
      photoUrl: user.photo
    });

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// À ajouter dans routes/auth.js

// ==================== MODIFIER SON PROFIL (AGENT CONNECTÉ) ====================
router.put('/profile', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { prenom, nom, tel, adresse, dateNaissance, email, motDePasse } = req.body;

    const agent = await User.findById(req.user._id);
    if (!agent) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ 
        message: 'Utilisateur introuvable' 
      });
    }

    // Vérifier que c'est bien un Agent
    if (agent.typeUtilisateur !== 'Agent') {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ 
        message: 'Cette route est réservée aux agents' 
      });
    }

    // Vérifier l'unicité de l'email si modifié
    if (email && email !== agent.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: agent._id } 
      });
      if (emailExists) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          message: 'Cet email existe déjà' 
        });
      }
      agent.email = email;
    }

    // Vérifier l'unicité du téléphone si modifié
    if (tel && tel !== agent.tel) {
      const telExists = await User.findOne({ 
        tel, 
        _id: { $ne: agent._id } 
      });
      if (telExists) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          message: 'Ce numéro de téléphone existe déjà' 
        });
      }
      agent.tel = tel;
    }

    // Mettre à jour les informations de base
    if (prenom) agent.prenom = prenom;
    if (nom) agent.nom = nom;
    if (adresse) agent.adresse = adresse;
    if (dateNaissance) agent.dateNaissance = new Date(dateNaissance);

    // Mettre à jour le mot de passe si fourni
    if (motDePasse) {
      const hashedPassword = await bcrypt.hash(motDePasse, 12);
      agent.motDePasse = hashedPassword;
    }

    // Gérer la nouvelle photo si fournie
    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      if (agent.photo) {
        const oldPhotoPath = require('path').join(__dirname, '..', agent.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      agent.photo = `/uploads/photos/${req.file.filename}`;
    }

    await agent.save();

    // Retourner les informations mises à jour sans les données sensibles
    const agentData = agent.toObject();
    delete agentData.motDePasse;
    delete agentData.activeTokens;
    delete agentData.passwordReset;

    res.json({
      message: 'Profil mis à jour avec succès',
      user: agentData
    });

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erreur modification profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// ==================== RÉCUPÉRER SON PROFIL ====================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-motDePasse -activeTokens -passwordReset');

    if (!user) {
      return res.status(404).json({ 
        message: 'Utilisateur introuvable' 
      });
    }

    res.json({
      message: 'Profil récupéré avec succès',
      user
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

//  ROUTE POUR SUPPRIMER LA PHOTO DE L'AGENT CONNECTÉ
router.delete('/profile/photo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (!user.photo) {
      return res.status(400).json({ message: 'Aucune photo à supprimer' });
    }

    // Supprimer le fichier physique
    const photoPath = require('path').join(__dirname, '..', user.photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
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

// ==================== CHANGEMENT DE MOT DE PASSE ====================

// ✅ Changer le mot de passe de l'utilisateur connecté
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(nouveauMotDePasse, 12);

    // Mettre à jour le mot de passe
    user.motDePasse = hashedNewPassword;
    user.pwdTemporaire = false; // ✅ Marquer comme mot de passe définitif
    await user.save();

    res.json({
      message: 'Mot de passe modifié avec succès',
      pwdTemporaire: false
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;