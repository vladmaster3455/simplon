/**
 * ============================================
 * ROUTES POUR LA SUPPRESSION LOGIQUE (SOFT DELETE)
 * ============================================
 * À ajouter dans users.js
 */

const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('./middleware');

const router = express.Router();

// ==================== SUPPRESSION LOGIQUE ====================

// Modifier la route GET /users pour exclure les utilisateurs supprimés
// REMPLACER la ligne: const users = await User.find({})
// PAR: const users = await User.find({ estSupprime: false })

// Supprimer un utilisateur (soft delete)
router.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ 
                error: 'Accès refusé. Seuls les agents peuvent supprimer un utilisateur.' 
            });
        }

        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (user.typeUtilisateur === 'Agent') {
            return res.status(403).json({ 
                error: 'Impossible de supprimer un agent' 
            });
        }

        if (user.estSupprime) {
            return res.status(400).json({ error: 'Cet utilisateur est déjà supprimé' });
        }

        // Suppression logique
        user.estSupprime = true;
        user.dateSuppression = new Date();
        user.supprimeParEmail = req.user.email;
        await user.save();

        res.json({
            message: 'Utilisateur masqué avec succès',
            user: {
                id: user._id,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Supprimer plusieurs utilisateurs (soft delete bulk)
router.delete('/users/bulk', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ 
                error: 'Accès refusé. Seuls les agents peuvent supprimer des utilisateurs.' 
            });
        }

        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                error: 'Veuillez fournir un tableau d\'IDs d\'utilisateurs' 
            });
        }

        const users = await User.find({
            _id: { $in: userIds },
            typeUtilisateur: { $ne: 'Agent' },
            estSupprime: false
        });

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'Aucun utilisateur trouvé ou tous sont des agents/déjà supprimés' 
            });
        }

        // Suppression logique multiple
        await User.updateMany(
            { _id: { $in: users.map(u => u._id) } },
            {
                $set: {
                    estSupprime: true,
                    dateSuppression: new Date(),
                    supprimeParEmail: req.user.email
                }
            }
        );

        res.json({
            message: `${users.length} utilisateur(s) masqué(s) avec succès`,
            deletedUsers: users.map(u => ({
                id: u._id,
                prenom: u.prenom,
                nom: u.nom,
                email: u.email
            }))
        });

    } catch (error) {
        console.error('Erreur suppression groupée:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== CONSULTATION DES SUPPRIMÉS ====================

// Voir les utilisateurs supprimés
router.get('/users/deleted', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ 
                error: 'Accès refusé. Seuls les agents peuvent voir les utilisateurs supprimés.' 
            });
        }

        const deletedUsers = await User.find({ estSupprime: true })
            .select('-motDePasse -activeTokens -passwordReset')
            .sort({ dateSuppression: -1 });

        res.json({
            users: deletedUsers,
            totalUsers: deletedUsers.length
        });

    } catch (error) {
        console.error('Erreur récupération utilisateurs supprimés:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== RESTAURATION ====================

// Restaurer un utilisateur
router.patch('/users/:id/restore', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ 
                error: 'Accès refusé. Seuls les agents peuvent restaurer un utilisateur.' 
            });
        }

        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (!user.estSupprime) {
            return res.status(400).json({ error: 'Cet utilisateur n\'est pas supprimé' });
        }

        // Restauration
        user.estSupprime = false;
        user.dateSuppression = null;
        user.supprimeParEmail = null;
        await user.save();

        res.json({
            message: 'Utilisateur restauré avec succès',
            user: {
                id: user._id,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Erreur restauration utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Restaurer plusieurs utilisateurs
router.patch('/users/bulk/restore', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ 
                error: 'Accès refusé. Seuls les agents peuvent restaurer des utilisateurs.' 
            });
        }

        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                error: 'Veuillez fournir un tableau d\'IDs d\'utilisateurs' 
            });
        }

        const users = await User.find({
            _id: { $in: userIds },
            estSupprime: true
        });

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'Aucun utilisateur supprimé trouvé' 
            });
        }

        // Restauration multiple
        await User.updateMany(
            { _id: { $in: users.map(u => u._id) } },
            {
                $set: {
                    estSupprime: false,
                    dateSuppression: null,
                    supprimeParEmail: null
                }
            }
        );

        res.json({
            message: `${users.length} utilisateur(s) restauré(s) avec succès`,
            restoredUsers: users.map(u => ({
                id: u._id,
                prenom: u.prenom,
                nom: u.nom,
                email: u.email
            }))
        });

    } catch (error) {
        console.error('Erreur restauration groupée:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

module.exports = router;
