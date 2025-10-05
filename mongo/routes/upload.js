const express = require('express');
const upload = require('../config/upload');
const { authenticateToken } = require('./middleware');
const { User } = require('../models');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ==================== UPLOAD PHOTO ====================
router.post('/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Aucun fichier fourni' 
            });
        }

        // Chemin relatif de la photo
        const photoPath = `/uploads/photos/${req.file.filename}`;

        // Mettre à jour l'utilisateur avec le chemin de la photo
        const user = await User.findById(req.user._id);
        if (!user) {
            // Supprimer le fichier si l'utilisateur n'existe pas
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Supprimer l'ancienne photo si elle existe
        if (user.photo) {
            const oldPhotoPath = path.join(__dirname, '..', user.photo);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        user.photo = photoPath;
        await user.save();

        res.json({
            success: true,
            message: 'Photo uploadée avec succès',
            photoUrl: photoPath
        });

    } catch (error) {
        // Supprimer le fichier en cas d'erreur
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Erreur upload photo:', error);
        res.status(500).json({ 
            error: error.message || 'Erreur lors de l\'upload' 
        });
    }
});

// ==================== SUPPRIMER PHOTO ====================
router.delete('/photo', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (!user.photo) {
            return res.status(400).json({ error: 'Aucune photo à supprimer' });
        }

        // Supprimer le fichier physique
        const photoPath = path.join(__dirname, '..', user.photo);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        // Retirer le chemin de la base de données
        user.photo = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Photo supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression photo:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

// ==================== RÉCUPÉRER LA PHOTO D'UN UTILISATEUR ====================
router.get('/photo/:userId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('photo');
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (!user.photo) {
            return res.status(404).json({ error: 'Aucune photo disponible' });
        }

        res.json({
            success: true,
            photoUrl: user.photo
        });

    } catch (error) {
        console.error('Erreur récupération photo:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
});

module.exports = router;