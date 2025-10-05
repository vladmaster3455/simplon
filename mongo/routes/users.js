const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticateToken } = require('./middleware');
const upload = require('../config/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ==================== CRÉATION ====================

// Créer un client (avec photo optionnelle)
router.post('/clients', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ 
                error: 'Accès refusé. Seuls les agents peuvent créer des clients.' 
            });
        }

        const { email, prenom, nom, telephone, nCarteIdentite, adresse, dateNaissance } = req.body;

        if (!email || !prenom || !nom || !telephone || !nCarteIdentite) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés' });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { nCarteIdentite }, { tel: telephone }] 
        });

        if (existingUser) {
            if (req.file) fs.unlinkSync(req.file.path);
            let conflictField = existingUser.email === email ? 'email' : 
                               existingUser.nCarteIdentite === nCarteIdentite ? 'carte d\'identité' : 
                               'numéro de téléphone';
            return res.status(400).json({ error: `Ce ${conflictField} existe déjà` });
        }

        // ✅ MOT DE PASSE AUTO-GÉNÉRÉ
        const motDePasseParDefaut = 'temp123';
        const hashedPassword = await bcrypt.hash(motDePasseParDefaut, 12);
        const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

        const client = new User({
            email, prenom, nom, tel: telephone, motDePasse: hashedPassword,
            nCarteIdentite, adresse,
            dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
            photo: photoPath,
            typeUtilisateur: 'Client',
            comptes: [{
                numeroCompte: `CLI${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                solde: 0, estBloque: 'Actif', createurEmail: req.user.email
            }],
            estActif: true,
            pwdTemporaire: true // ✅ Marquer comme mot de passe temporaire
        });

        await client.save();

        const clientData = client.toObject();
        delete clientData.motDePasse;
        delete clientData.activeTokens;
        delete clientData.passwordReset;

        res.status(201).json({ 
            message: 'Client créé avec succès', 
            client: clientData,
            motDePasseParDefaut: motDePasseParDefaut // ✅ Retourner le mot de passe par défaut
        });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Erreur création client:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let fieldName = field === 'email' ? 'email' : 
                           field === 'nCarteIdentite' ? 'carte d\'identité' : 
                           field === 'tel' ? 'numéro de téléphone' : 'champ';
            return res.status(400).json({ error: `Ce ${fieldName} existe déjà dans la base de données` });
        }
        
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Créer un distributeur (avec photo optionnelle)
router.post('/distributeurs', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent créer des distributeurs.' });
        }

        const { email, prenom, nom, telephone, nCarteIdentite, adresse, dateNaissance } = req.body;

        if (!email || !prenom || !nom || !telephone || !nCarteIdentite) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés' });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { nCarteIdentite }, { tel: telephone }] 
        });

        if (existingUser) {
            if (req.file) fs.unlinkSync(req.file.path);
            let conflictField = existingUser.email === email ? 'email' : 
                               existingUser.nCarteIdentite === nCarteIdentite ? 'carte d\'identité' : 
                               'numéro de téléphone';
            return res.status(400).json({ error: `Ce ${conflictField} existe déjà` });
        }

        // ✅ MOT DE PASSE AUTO-GÉNÉRÉ
        const motDePasseParDefaut = 'temp123';
        const hashedPassword = await bcrypt.hash(motDePasseParDefaut, 12);
        const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

        const distributeur = new User({
            email, prenom, nom, tel: telephone, motDePasse: hashedPassword,
            nCarteIdentite, adresse,
            dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
            photo: photoPath,
            typeUtilisateur: 'Distributeur',
            comptes: [{
                numeroCompte: `DIS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                solde: 0, estBloque: 'Actif', createurEmail: req.user.email
            }],
            soldeBonus: 0, estActif: true,
            pwdTemporaire: true // ✅ Marquer comme mot de passe temporaire
        });

        await distributeur.save();

        const distributeurData = distributeur.toObject();
        delete distributeurData.motDePasse;
        delete distributeurData.activeTokens;
        delete distributeurData.passwordReset;

        res.status(201).json({ 
            message: 'Distributeur créé avec succès', 
            distributeur: distributeurData,
            motDePasseParDefaut: motDePasseParDefaut // ✅ Retourner le mot de passe par défaut
        });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Erreur création distributeur:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let fieldName = field === 'email' ? 'email' : 
                           field === 'nCarteIdentite' ? 'carte d\'identité' : 
                           field === 'tel' ? 'numéro de téléphone' : 'champ';
            return res.status(400).json({ error: `Ce ${fieldName} existe déjà dans la base de données` });
        }
        
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== CRÉDITER UN DISTRIBUTEUR ====================
router.post('/:id/credit', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent créditer des comptes.' });
        }

        const { id } = req.params;
        const { montant } = req.body;

        if (!montant || montant <= 0) {
            return res.status(400).json({ error: 'Le montant doit être supérieur à 0' });
        }

        if (montant < 100) {
            return res.status(400).json({ error: 'Le montant minimum est de 100 FCFA' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (user.typeUtilisateur !== 'Distributeur') {
            return res.status(400).json({ 
                error: `Vous ne pouvez créditer que des Distributeurs. Ce compte est un ${user.typeUtilisateur}.` 
            });
        }

        if (!user.comptes || user.comptes.length === 0) {
            return res.status(404).json({ error: 'Aucun compte trouvé pour cet utilisateur' });
        }

        if (!user.estActif) {
            return res.status(400).json({ error: 'Le compte est bloqué' });
        }

        const compte = user.comptes[0];
        const numeroTransaction = `TRX${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const transaction = {
            numeroTransaction,
            dateTransaction: new Date(),
            typeTransaction: 'Credit_Agent',
            montant: parseFloat(montant),
            frais: 0, bonus: 0,
            montantTotal: parseFloat(montant),
            compteSource: 'AGENT_SYSTEM',
            compteDestination: compte.numeroCompte,
            acteurs: {
                agentEmail: req.user.email,
                distributeurEmail: user.email
            },
            statut: 'Validee',
            dateValidation: new Date(),
            valideParEmail: req.user.email,
            details: {
                description: `Crédit par Agent ${req.user.prenom} ${req.user.nom}`,
                adresseIP: req.ip,
                deviceInfo: req.get('User-Agent') || 'Unknown'
            },
            annulation: { estAnnulee: false }
        };

        compte.solde += parseFloat(montant);
        user.transactions.push(transaction);

        const agent = await User.findById(req.user._id);
        if (agent) {
            agent.transactions.push(transaction);
            await agent.save();
        }

        await user.save();

        res.json({
            success: true,
            message: 'Compte Distributeur crédité avec succès',
            transaction: {
                numeroTransaction,
                montant: parseFloat(montant),
                nouveauSolde: compte.solde,
                beneficiaire: `${user.prenom} ${user.nom}`,
                typeUtilisateur: user.typeUtilisateur,
                numeroCompte: compte.numeroCompte
            }
        });

    } catch (error) {
        console.error('Erreur crédit compte:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== CONSULTATION ====================

// Voir TOUS les utilisateurs (ACTIFS uniquement par défaut)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent voir tous les utilisateurs.' });
        }

        // Par défaut, ne voir que les utilisateurs actifs (non supprimés)
        const users = await User.find({ estSupprime: false })
            .select('-motDePasse -activeTokens -passwordReset')
            .sort({ dateCreation: -1 });

        res.json({ users, totalUsers: users.length });

    } catch (error) {
        console.error('Erreur récupération users:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Lister les clients
router.get('/clients', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent voir les clients.' });
        }

        const clients = await User.find({ 
            typeUtilisateur: 'Client',
            estSupprime: false 
        })
            .select('-motDePasse -activeTokens -passwordReset')
            .sort({ dateCreation: -1 });

        res.json({ clients, totalClients: clients.length });

    } catch (error) {
        console.error('Erreur récupération clients:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Lister les distributeurs
router.get('/distributeurs', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent voir les distributeurs.' });
        }

        const distributeurs = await User.find({ 
            typeUtilisateur: 'Distributeur',
            estSupprime: false 
        })
            .select('-motDePasse -activeTokens -passwordReset')
            .sort({ dateCreation: -1 });

        res.json({ distributeurs, totalDistributeurs: distributeurs.length });

    } catch (error) {
        console.error('Erreur récupération distributeurs:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Voir un utilisateur par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent voir les détails d\'un utilisateur.' });
        }

        const { id } = req.params;
        const user = await User.findById(id).select('-motDePasse -activeTokens -passwordReset');

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== MODIFICATION ====================

// Modifier un utilisateur par ID (avec photo optionnelle)
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent modifier un utilisateur.' });
        }

        const { id } = req.params;
        const { email, prenom, nom, tel, motDePasse, adresse, dateNaissance } = req.body;

        // ✅ EMPÊCHER L'AGENT DE MODIFIER SON PROPRE COMPTE
        if (id === req.user._id.toString()) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre compte' });
        }

        const user = await User.findById(id);
        if (!user) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: id } });
            if (emailExists) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: 'Cet email existe déjà' });
            }
        }

        if (tel && tel !== user.tel) {
            const telExists = await User.findOne({ tel, _id: { $ne: id } });
            if (telExists) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: 'Ce numéro de téléphone existe déjà' });
            }
        }

        const updateData = {};
        if (email) updateData.email = email;
        if (prenom) updateData.prenom = prenom;
        if (nom) updateData.nom = nom;
        if (tel) updateData.tel = tel;
        if (adresse) updateData.adresse = adresse;
        if (dateNaissance) updateData.dateNaissance = new Date(dateNaissance);
        if (motDePasse) updateData.motDePasse = await bcrypt.hash(motDePasse, 12);

        if (req.file) {
            if (user.photo) {
                const oldPhotoPath = path.join(__dirname, '..', user.photo);
                if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
            }
            updateData.photo = `/uploads/photos/${req.file.filename}`;
        }

        Object.assign(user, updateData);
        await user.save();

        const userData = user.toObject();
        delete userData.motDePasse;
        delete userData.activeTokens;
        delete userData.passwordReset;

        res.json({ message: 'Utilisateur modifié avec succès', user: userData });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Erreur modification utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== BLOCAGE/DÉBLOCAGE ====================

// Bloquer/Débloquer un utilisateur par ID
router.post('/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent bloquer/débloquer un utilisateur.' });
        }

        const { id } = req.params;
        const { estActif } = req.body;

        // ✅ EMPÊCHER L'AGENT DE BLOQUER SON PROPRE COMPTE
        if (id === req.user._id.toString()) {
            return res.status(403).json({ error: 'Vous ne pouvez pas bloquer/débloquer votre propre compte' });
        }

        if (typeof estActif !== 'boolean') {
            return res.status(400).json({ error: 'Le statut doit être un booléen (true pour actif, false pour bloqué)' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        user.estActif = estActif;
        await user.save();

        const action = estActif ? 'débloqué' : 'bloqué';
        res.json({
            message: `Utilisateur ${action} avec succès`,
            user: { id: user._id, prenom: user.prenom, nom: user.nom, estActif: user.estActif }
        });

    } catch (error) {
        console.error('Erreur changement statut utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Bloquer plusieurs utilisateurs
router.post('/bulk/block', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent bloquer des utilisateurs.' });
        }

        const { userIds, estActif = false } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'Veuillez fournir un tableau d\'IDs d\'utilisateurs' });
        }

        // ✅ EXCLURE L'ID DE L'AGENT CONNECTÉ
        const filteredUserIds = userIds.filter(id => id !== req.user._id.toString());

        const users = await User.find({ _id: { $in: filteredUserIds }, typeUtilisateur: { $ne: 'Agent' } });

        if (users.length === 0) {
            return res.status(404).json({ error: 'Aucun utilisateur trouvé ou tous sont des agents' });
        }

        await User.updateMany(
            { _id: { $in: users.map(u => u._id) }, typeUtilisateur: { $ne: 'Agent' } },
            { estActif }
        );

        const action = estActif ? 'débloqué' : 'bloqué';
        res.json({
            message: `${users.length} utilisateur(s) ${action}(s) avec succès`,
            modifiedUsers: users.map(u => ({ id: u._id, prenom: u.prenom, nom: u.nom, nouveauStatut: estActif }))
        });

    } catch (error) {
        console.error('Erreur blocage groupé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== SUPPRESSION LOGIQUE ====================

// ✅ Supprimer un utilisateur (SOFT DELETE)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent supprimer un utilisateur.' });
        }

        const { id } = req.params;

        // ✅ EMPÊCHER L'AGENT DE SUPPRIMER SON PROPRE COMPTE
        if (id === req.user._id.toString()) {
            return res.status(403).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        // Chercher explicitement avec estSupprime: false pour être sûr
        const user = await User.findOne({ _id: id, estSupprime: false });
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable ou déjà supprimé' });
        }

        if (user.typeUtilisateur === 'Agent') {
            return res.status(403).json({ error: 'Impossible de supprimer un agent' });
        }

        // Utiliser la méthode softDelete du schéma
        await user.softDelete(req.user.email);

        res.json({
            message: 'Utilisateur supprimé avec succès (archivé)',
            user: { id: user._id, prenom: user.prenom, nom: user.nom, email: user.email }
        });

    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ✅ Supprimer plusieurs utilisateurs (SOFT DELETE BULK)
router.delete('/bulk', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent supprimer des utilisateurs.' });
        }

        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'Veuillez fournir un tableau d\'IDs d\'utilisateurs' });
        }

        // ✅ EXCLURE L'ID DE L'AGENT CONNECTÉ
        const filteredUserIds = userIds.filter(id => id !== req.user._id.toString());

        const users = await User.find({
            _id: { $in: filteredUserIds },
            typeUtilisateur: { $ne: 'Agent' },
            estSupprime: false
        });

        if (users.length === 0) {
            return res.status(404).json({ error: 'Aucun utilisateur trouvé ou tous sont des agents/déjà supprimés' });
        }

        // Utiliser la méthode statique softDeleteMany
        await User.softDeleteMany(users.map(u => u._id), req.user.email);

        res.json({
            message: `${users.length} utilisateur(s) supprimé(s) avec succès (archivés)`,
            deletedUsers: users.map(u => ({ id: u._id, prenom: u.prenom, nom: u.nom, email: u.email }))
        });

    } catch (error) {
        console.error('Erreur suppression groupée:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== CONSULTATION DES SUPPRIMÉS ====================

// ✅ Voir les utilisateurs supprimés
router.get('/deleted/list', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent voir les utilisateurs supprimés.' });
        }

        const deletedUsers = await User.findDeleted()
            .select('-motDePasse -activeTokens -passwordReset')
            .sort({ dateSuppression: -1 });

        res.json({
            message: 'Liste des utilisateurs supprimés',
            users: deletedUsers,
            totalUsers: deletedUsers.length
        });

    } catch (error) {
        console.error('Erreur récupération utilisateurs supprimés:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== RESTAURATION ====================

router.patch('/:id/restore', authenticateToken, async (req, res) => {
  try {
    if (req.user.typeUtilisateur !== 'Agent') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent restaurer un utilisateur.' });
    }

    const { id } = req.params;

    // ✅ SOLUTION : findById + select pour bypasser le middleware
    const user = await User.findById(id).select('+estSupprime +dateSuppression +supprimeParEmail');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (!user.estSupprime) {
      return res.status(400).json({ error: 'Cet utilisateur n\'est pas supprimé' });
    }

    // Utiliser la méthode restore du schéma
    await user.restore();

    res.json({
      message: 'Utilisateur restauré avec succès',
      user: { id: user._id, prenom: user.prenom, nom: user.nom, email: user.email }
    });

  } catch (error) {
    console.error('Erreur restauration utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ✅ Restaurer plusieurs utilisateurs
router.patch('/bulk/restore', authenticateToken, async (req, res) => {
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

        // Récupérer tous les utilisateurs avec leurs champs d'archivage
        const users = await User.find({ _id: { $in: userIds } })
            .select('+estSupprime +dateSuppression +supprimeParEmail');

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'Aucun utilisateur trouvé avec ces IDs' 
            });
        }

        // Filtrer pour ne garder que les utilisateurs supprimés
        const deletedUsers = users.filter(u => u.estSupprime === true);

        if (deletedUsers.length === 0) {
            return res.status(400).json({ 
                error: 'Aucun de ces utilisateurs n\'est archivé' 
            });
        }

        // Restaurer uniquement les utilisateurs archivés
        await User.restoreMany(deletedUsers.map(u => u._id));

        res.json({
            message: `${deletedUsers.length} utilisateur(s) restauré(s) avec succès`,
            restoredUsers: deletedUsers.map(u => ({ 
                id: u._id, 
                prenom: u.prenom, 
                nom: u.nom, 
                email: u.email 
            })),
            skipped: users.length - deletedUsers.length
        });

    } catch (error) {
        console.error('Erreur restauration groupée:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== SUPPRESSION PHYSIQUE (DÉFINITIVE) ====================

// ✅ Supprimer DÉFINITIVEMENT un utilisateur (Hard Delete)
// ⚠️ À utiliser avec EXTRÊME PRUDENCE - Suppression irréversible
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ error: 'Accès refusé. Seuls les agents peuvent supprimer définitivement un utilisateur.' });
        }

        const { id } = req.params;
        const { confirmation } = req.body;

        // Exiger une confirmation explicite
        if (confirmation !== 'SUPPRIMER_DEFINITIVEMENT') {
            return res.status(400).json({ 
                error: 'Confirmation requise. Envoyez { "confirmation": "SUPPRIMER_DEFINITIVEMENT" }' 
            });
        }

        // Chercher l'utilisateur (même supprimé logiquement)
        const user = await User.findOne({ _id: id }).select('+estSupprime');
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        if (user.typeUtilisateur === 'Agent') {
            return res.status(403).json({ error: 'Impossible de supprimer définitivement un agent' });
        }

        // Vérifier qu'il n'a pas de solde
        const totalSolde = user.comptes.reduce((total, compte) => total + compte.solde, 0);
        if (totalSolde > 0 || (user.soldeBonus && user.soldeBonus > 0)) {
            return res.status(400).json({ 
                error: 'Impossible de supprimer définitivement un utilisateur avec un solde positif',
                soldeTotal: totalSolde,
                soldeBonus: user.soldeBonus
            });
        }

        // Supprimer la photo si elle existe
        if (user.photo) {
            const photoPath = path.join(__dirname, '..', user.photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        const userData = { id: user._id, prenom: user.prenom, nom: user.nom, email: user.email };

        // SUPPRESSION PHYSIQUE DÉFINITIVE
        await User.findByIdAndDelete(id);

        res.json({
            message: '⚠️ Utilisateur supprimé DÉFINITIVEMENT de la base de données',
            deletedUser: userData,
            warning: 'Cette action est irréversible'
        });

    } catch (error) {
        console.error('Erreur suppression physique:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

module.exports = router;
