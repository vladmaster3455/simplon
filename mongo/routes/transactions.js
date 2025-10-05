const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('./middleware');

const router = express.Router();

// ==================== DÃ‰PÃ”T (Distributeur â†’ Client) ====================
router.post('/depot', authenticateToken, async (req, res) => {
    try {
        // VÃ©rifier que c'est un distributeur
        if (req.user.typeUtilisateur !== 'Distributeur') {
            return res.status(403).json({ 
                error: 'Seuls les distributeurs peuvent effectuer des dÃ©pÃ´ts' 
            });
        }

        const { montant, numeroCompte_destination } = req.body;

        // Validations
        if (!montant || !numeroCompte_destination) {
            return res.status(400).json({ 
                error: 'Montant et numÃ©ro de compte de destination requis' 
            });
        }

        if (montant <= 0) {
            return res.status(400).json({ error: 'Le montant doit Ãªtre positif' });
        }

        // Trouver le distributeur connectÃ©
        const distributeur = await User.findById(req.user._id);
        if (!distributeur || !distributeur.comptes || distributeur.comptes.length === 0) {
            return res.status(404).json({ error: 'Compte distributeur introuvable' });
        }

        const compteDistributeur = distributeur.comptes[0];

        // VÃ©rifier le solde du distributeur
        if (compteDistributeur.solde < montant) {
            return res.status(400).json({ 
                error: `Solde insuffisant. Votre solde: ${compteDistributeur.solde} FCFA` 
            });
        }

        // Trouver le client destinataire
        const client = await User.findOne({
            'comptes.numeroCompte': numeroCompte_destination,
            typeUtilisateur: 'Client',
            'comptes.estBloque': 'Actif'
        });

        if (!client || !client.comptes || client.comptes.length === 0) {
            return res.status(404).json({ 
                error: 'Compte client non trouvÃ© ou bloquÃ©' 
            });
        }

        const compteClient = client.comptes.find(c => c.numeroCompte === numeroCompte_destination);

        // Calculer la commission (1%)
        const commission = Math.round(montant * 0.01);

        // GÃ©nÃ©rer numÃ©ro de transaction
        const numeroTransaction = `TRX${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // CrÃ©er l'objet transaction
        const transaction = {
            numeroTransaction,
            dateTransaction: new Date(),
            typeTransaction: 'Depot',
            montant,
            frais: 0,
            bonus: commission,
            montantTotal: montant,
            compteSource: compteDistributeur.numeroCompte,
            compteDestination: compteClient.numeroCompte,
            acteurs: {
                clientEmail: client.email,
                distributeurEmail: distributeur.email
            },
            statut: 'Validee',
            dateValidation: new Date(),
            valideParEmail: distributeur.email,
            details: {
                description: 'DÃ©pÃ´t en espÃ¨ces',
                adresseIP: req.ip,
                deviceInfo: req.get('User-Agent') || 'Unknown'
            }
        };

        // Effectuer les opÃ©rations
        // 1. DÃ©biter le distributeur
        compteDistributeur.solde -= montant;
        
        // 2. CrÃ©diter le client
        compteClient.solde += montant;
        
        // 3. Ajouter commission au distributeur
        distributeur.soldeBonus = (distributeur.soldeBonus || 0) + commission;
        
        // 4. Ajouter transaction au distributeur et au client
        distributeur.transactions.push(transaction);
        client.transactions.push(transaction);

        // Sauvegarder les modifications
        await distributeur.save();
        await client.save();

        res.json({
            success: true,
            message: 'DÃ©pÃ´t effectuÃ© avec succÃ¨s',
            transaction: {
                numeroTransaction,
                montant,
                commission,
                nouveauSoldeClient: compteClient.solde,
                nouveauSoldeDistributeur: compteDistributeur.solde,
                nouveauBonusDistributeur: distributeur.soldeBonus
            }
        });

    } catch (error) {
        console.error('Erreur dÃ©pÃ´t:', error);
        res.status(500).json({ error: 'Erreur lors du dÃ©pÃ´t' });
    }
});

// ==================== RETRAIT (Client â†’ Distributeur) ====================
router.post('/retrait', authenticateToken, async (req, res) => {
    try {
        // VÃ©rifier que c'est un distributeur
        if (req.user.typeUtilisateur !== 'Distributeur') {
            return res.status(403).json({ 
                error: 'Seuls les distributeurs peuvent effectuer des retraits' 
            });
        }

        const { montant, numeroCompte_source } = req.body;

        if (!montant || !numeroCompte_source) {
            return res.status(400).json({ 
                error: 'Montant et numÃ©ro de compte source requis' 
            });
        }

        if (montant <= 0) {
            return res.status(400).json({ error: 'Le montant doit Ãªtre positif' });
        }

        // Trouver le distributeur
        const distributeur = await User.findById(req.user._id);
        if (!distributeur || !distributeur.comptes || distributeur.comptes.length === 0) {
            return res.status(404).json({ error: 'Compte distributeur introuvable' });
        }

        const compteDistributeur = distributeur.comptes[0];

        // Trouver le client
        const client = await User.findOne({
            'comptes.numeroCompte': numeroCompte_source,
            typeUtilisateur: 'Client',
            'comptes.estBloque': 'Actif'
        });

        if (!client || !client.comptes || client.comptes.length === 0) {
            return res.status(404).json({ error: 'Compte client non trouvÃ© ou bloquÃ©' });
        }

        const compteClient = client.comptes.find(c => c.numeroCompte === numeroCompte_source);

        // VÃ©rifier le solde du client
        if (compteClient.solde < montant) {
            return res.status(400).json({ 
                error: `Solde insuffisant. Solde client: ${compteClient.solde} FCFA` 
            });
        }

        const commission = Math.round(montant * 0.01);
        const numeroTransaction = `TRX${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const transaction = {
            numeroTransaction,
            dateTransaction: new Date(),
            typeTransaction: 'Retrait',
            montant,
            frais: 0,
            bonus: commission,
            montantTotal: montant,
            compteSource: compteClient.numeroCompte,
            compteDestination: compteDistributeur.numeroCompte,
            acteurs: {
                clientEmail: client.email,
                distributeurEmail: distributeur.email
            },
            statut: 'Validee',
            dateValidation: new Date(),
            valideParEmail: distributeur.email,
            details: {
                description: 'Retrait en espÃ¨ces',
                adresseIP: req.ip,
                deviceInfo: req.get('User-Agent') || 'Unknown'
            }
        };

        // OpÃ©rations
        compteClient.solde -= montant;
        compteDistributeur.solde += montant;
        distributeur.soldeBonus = (distributeur.soldeBonus || 0) + commission;
        
        distributeur.transactions.push(transaction);
        client.transactions.push(transaction);

        await distributeur.save();
        await client.save();

        res.json({
            success: true,
            message: 'Retrait effectuÃ© avec succÃ¨s',
            transaction: {
                numeroTransaction,
                montant,
                commission,
                nouveauSoldeClient: compteClient.solde,
                nouveauSoldeDistributeur: compteDistributeur.solde,
                nouveauBonusDistributeur: distributeur.soldeBonus
            }
        });

    } catch (error) {
        console.error('Erreur retrait:', error);
        res.status(500).json({ error: 'Erreur lors du retrait' });
    }
});

// ==================== TRANSFERT (Client â†’ Client) ====================
router.post('/transfert', authenticateToken, async (req, res) => {
    try {
        // VÃ©rifier que c'est un client
        if (req.user.typeUtilisateur !== 'Client') {
            return res.status(403).json({ 
                error: 'Seuls les clients peuvent effectuer des transferts' 
            });
        }

        const { montant, numeroCompte_destination, telephone_destinataire } = req.body;

        if (!montant || (!numeroCompte_destination && !telephone_destinataire)) {
            return res.status(400).json({ 
                error: 'Montant et (numÃ©ro de compte OU tÃ©lÃ©phone) requis' 
            });
        }

        if (montant <= 0) {
            return res.status(400).json({ error: 'Le montant doit Ãªtre positif' });
        }

        if (montant < 100) {
            return res.status(400).json({ error: 'Montant minimum: 100 FCFA' });
        }

        // Trouver l'expÃ©diteur
        const expediteur = await User.findById(req.user._id);
        if (!expediteur || !expediteur.comptes || expediteur.comptes.length === 0) {
            return res.status(404).json({ error: 'Votre compte est introuvable' });
        }

        const compteExpediteur = expediteur.comptes[0];

        // Calculer frais (2%)
        const frais = Math.round(montant * 0.02);
        const montantTotal = montant + frais;

        // VÃ©rifier le solde
        if (compteExpediteur.solde < montantTotal) {
            return res.status(400).json({ 
                error: `Solde insuffisant. Besoin: ${montantTotal} FCFA (${montant} + ${frais} frais)` 
            });
        }

        // Trouver le destinataire
        let destinataire;
        if (telephone_destinataire) {
            destinataire = await User.findOne({
                tel: telephone_destinataire,
                typeUtilisateur: 'Client',
                'comptes.estBloque': 'Actif'
            });
        } else {
            destinataire = await User.findOne({
                'comptes.numeroCompte': numeroCompte_destination,
                typeUtilisateur: 'Client',
                'comptes.estBloque': 'Actif'
            });
        }

        if (!destinataire || !destinataire.comptes || destinataire.comptes.length === 0) {
            return res.status(404).json({ error: 'Destinataire introuvable' });
        }

        const compteDestinataire = destinataire.comptes[0];

        // VÃ©rifier qu'on ne transfÃ¨re pas vers soi-mÃªme
        if (expediteur._id.toString() === destinataire._id.toString()) {
            return res.status(400).json({ 
                error: 'Vous ne pouvez pas transfÃ©rer vers votre propre compte' 
            });
        }

        const numeroTransaction = `TRX${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const transaction = {
            numeroTransaction,
            dateTransaction: new Date(),
            typeTransaction: 'Transfert',
            montant,
            frais,
            bonus: 0,
            montantTotal,
            compteSource: compteExpediteur.numeroCompte,
            compteDestination: compteDestinataire.numeroCompte,
            acteurs: {
                clientEmail: expediteur.email
            },
            statut: 'Validee',
            dateValidation: new Date(),
            valideParEmail: expediteur.email,
            details: {
                description: `Transfert vers ${destinataire.prenom} ${destinataire.nom}`,
                adresseIP: req.ip,
                deviceInfo: req.get('User-Agent') || 'Unknown'
            }
        };

        // OpÃ©rations
        compteExpediteur.solde -= montantTotal;
        compteDestinataire.solde += montant;
        
        expediteur.transactions.push(transaction);
        destinataire.transactions.push(transaction);

        await expediteur.save();
        await destinataire.save();

        res.json({
            success: true,
            message: 'Transfert effectuÃ© avec succÃ¨s',
            transaction: {
                numeroTransaction,
                montant,
                frais,
                montantTotal,
                destinataire: `${destinataire.prenom} ${destinataire.nom}`,
                numeroCompteDestination: compteDestinataire.numeroCompte,
                nouveauSoldeExpediteur: compteExpediteur.solde
            }
        });

    } catch (error) {
        console.error('Erreur transfert:', error);
        res.status(500).json({ error: 'Erreur lors du transfert' });
    }
});

// ==================== VÃ‰RIFIER UN NUMÃ‰RO DE TÃ‰LÃ‰PHONE ====================
router.post('/verifier-telephone', authenticateToken, async (req, res) => {
    try {
        const { telephone } = req.body;

        if (!telephone) {
            return res.status(400).json({ error: 'NumÃ©ro de tÃ©lÃ©phone requis' });
        }

        const user = await User.findOne({
            tel: telephone,
            typeUtilisateur: 'Client',
            'comptes.estBloque': 'Actif'
        }).select('nom prenom tel comptes');

        if (!user || !user.comptes || user.comptes.length === 0) {
            return res.status(404).json({ 
                error: 'Aucun compte actif trouvÃ© pour ce numÃ©ro' 
            });
        }

        res.json({
            success: true,
            message: 'Compte trouvÃ©',
            proprietaire: `${user.prenom} ${user.nom}`,
            numeroCompte: user.comptes[0].numeroCompte,
            telephone: user.tel
        });

    } catch (error) {
        console.error('Erreur vÃ©rification tÃ©lÃ©phone:', error);
        res.status(500).json({ error: 'Erreur lors de la vÃ©rification' });
    }
});


// ==================== HISTORIQUE DES TRANSACTIONS ====================
// ==================== HISTORIQUE DES TRANSACTIONS (CORRIGÉ) ====================
router.get('/historique', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;

        let transactions = [];

        if (req.user.typeUtilisateur === 'Agent') {
            // ✅ L'AGENT VOIT TOUTES LES TRANSACTIONS DU SYSTÈME
            const allUsers = await User.find({}).select('transactions prenom nom email typeUtilisateur');
            
            allUsers.forEach(user => {
                user.transactions.forEach(transaction => {
                    transactions.push({
                        ...transaction.toObject(),
                        proprietaire: { // On garde l'information du propriétaire original
                            nom: user.nom,
                            prenom: user.prenom,
                            email: user.email,
                            type: user.typeUtilisateur
                        }
                    });
                });
            });

            // 🌟 ÉTAPE DE DÉDOBLONNAGE CLÉ 🌟
            // On utilise un Map pour filtrer les transactions ayant le même numeroTransaction.
            const uniqueTransactionsMap = new Map();
            transactions.forEach(t => {
                // Si le numéro de transaction n'est pas déjà dans la Map, ou si on veut
                // s'assurer de ne prendre qu'une seule instance, on l'ajoute.
                // NOTE: On ne devrait pas se baser sur quel acteur on prend (proprietaire)
                // pour l'affichage de l'historique général, car l'important est la transaction.
                if (!uniqueTransactionsMap.has(t.numeroTransaction)) {
                    uniqueTransactionsMap.set(t.numeroTransaction, t);
                }
            });
            
            // On remplace le tableau "transactions" par les valeurs uniques de la Map
            transactions = Array.from(uniqueTransactionsMap.values());
            // 🌟 FIN DU DÉDOBLONNAGE 🌟

            // Trier par date décroissante
            transactions.sort((a, b) => new Date(b.dateTransaction) - new Date(a.dateTransaction));

        } else {
            // Client ou Distributeur voit SEULEMENT ses propres transactions (cette logique est correcte)
            const user = await User.findById(req.user._id).select('transactions');

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur introuvable' });
            }

            transactions = user.transactions
                .map(t => t.toObject())
                .sort((a, b) => new Date(b.dateTransaction) - new Date(a.dateTransaction));
        }

        // Pagination
        const paginatedTransactions = transactions.slice((page - 1) * limit, page * limit);

        res.json({
            success: true,
            message: 'Historique récupéré',
            transactions: paginatedTransactions,
            count: paginatedTransactions.length,
            totalTransactions: transactions.length,
            page,
            limit
        });

    } catch (error) {
        console.error('Erreur historique:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
});
// ==================== DÃ‰TAILS D'UNE TRANSACTION ====================

// ==================== ANNULER UNE TRANSACTION ====================
router.post('/annuler/:numeroTransaction', authenticateToken, async (req, res) => {
    try {
        const { numeroTransaction } = req.params;
        const { raison } = req.body;

        // Seuls les agents et distributeurs peuvent annuler
        if (!['Agent', 'Distributeur'].includes(req.user.typeUtilisateur)) {
            return res.status(403).json({ 
                error: 'Seuls les agents et distributeurs peuvent annuler des transactions' 
            });
        }

        // Trouver la transaction chez le distributeur ou l'utilisateur concernÃ©
        let userAvecTransaction;
        let transaction;

        if (req.user.typeUtilisateur === 'Distributeur') {
            // Le distributeur ne peut annuler que ses propres transactions
            userAvecTransaction = await User.findById(req.user._id);
            transaction = userAvecTransaction.transactions.find(
                t => t.numeroTransaction === numeroTransaction && 
                     !t.annulation.estAnnulee &&
                     ['Depot', 'Retrait'].includes(t.typeTransaction)
            );

            if (!transaction) {
                return res.status(404).json({ 
                    error: 'Transaction introuvable ou dÃ©jÃ  annulÃ©e' 
                });
            }
        } else {
            // Agent peut annuler toutes les transactions
            userAvecTransaction = await User.findOne({
                'transactions.numeroTransaction': numeroTransaction
            });

            if (!userAvecTransaction) {
                return res.status(404).json({ error: 'Transaction introuvable' });
            }

            transaction = userAvecTransaction.transactions.find(
                t => t.numeroTransaction === numeroTransaction
            );

            if (transaction.annulation.estAnnulee) {
                return res.status(400).json({ error: 'Transaction dÃ©jÃ  annulÃ©e' });
            }
        }

        // Trouver les comptes concernÃ©s pour le rollback
        const compteSource = transaction.compteSource;
        const compteDestination = transaction.compteDestination;

        // Rollback selon le type
        if (transaction.typeTransaction === 'Depot') {
            // Rembourser le distributeur, dÃ©biter le client
            const distributeur = await User.findOne({ 
                'comptes.numeroCompte': compteSource 
            });
            const client = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (distributeur && client) {
                distributeur.comptes[0].solde += transaction.montant;
                client.comptes[0].solde -= transaction.montant;
                distributeur.soldeBonus -= transaction.bonus;

                await distributeur.save();
                await client.save();
            }
        } else if (transaction.typeTransaction === 'Retrait') {
            // Rembourser le client, dÃ©biter le distributeur
            const client = await User.findOne({ 
                'comptes.numeroCompte': compteSource 
            });
            const distributeur = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (client && distributeur) {
                client.comptes[0].solde += transaction.montant;
                distributeur.comptes[0].solde -= transaction.montant;
                distributeur.soldeBonus -= transaction.bonus;

                await client.save();
                await distributeur.save();
            }
        } else if (transaction.typeTransaction === 'Transfert' && req.user.typeUtilisateur === 'Agent') {
            // Seulement les agents peuvent annuler les transferts
            const expediteur = await User.findOne({ 
                'comptes.numeroCompte': compteSource 
            });
            const destinataire = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (expediteur && destinataire) {
                expediteur.comptes[0].solde += transaction.montantTotal;
                destinataire.comptes[0].solde -= transaction.montant;

                await expediteur.save();
                await destinataire.save();
            }
        } 
        // âœ… NOUVEAU : Gestion de l'annulation Credit_Agent
        else if (transaction.typeTransaction === 'Credit_Agent' && req.user.typeUtilisateur === 'Agent') {
            // L'Agent annule un crÃ©dit qu'il a fait Ã  un Distributeur
            
            // Trouver le Distributeur qui a Ã©tÃ© crÃ©ditÃ©
            const distributeur = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (!distributeur) {
                return res.status(404).json({ 
                    error: 'Distributeur introuvable pour cette transaction' 
                });
            }

            // VÃ©rifier que le Distributeur a assez de solde pour le rollback
            if (distributeur.comptes[0].solde < transaction.montant) {
                return res.status(400).json({ 
                    error: `Impossible d'annuler : solde insuffisant chez le distributeur (${distributeur.comptes[0].solde} FCFA disponible, ${transaction.montant} FCFA requis)` 
                });
            }

            // DÃ©biter le Distributeur (annuler le crÃ©dit)
            distributeur.comptes[0].solde -= transaction.montant;
            
            // Sauvegarder
            await distributeur.save();

            console.log(`âœ… Credit_Agent annulÃ©: ${transaction.montant} FCFA dÃ©bitÃ©s du distributeur ${distributeur.email}`);
        }

        // Marquer comme annulÃ©e
        transaction.annulation.estAnnulee = true;
        transaction.annulation.dateAnnulation = new Date();
        transaction.annulation.annuleeParEmail = req.user.email;
        transaction.annulation.raison = raison || 'Non spÃ©cifiÃ©e';
        transaction.statut = 'Annulee';

        await userAvecTransaction.save();

        res.json({
            success: true,
            message: 'Transaction annulÃ©e avec succÃ¨s',
            transaction: {
                numeroTransaction,
                typeTransaction: transaction.typeTransaction,
                montant: transaction.montant,
                dateAnnulation: transaction.annulation.dateAnnulation
            }
        });

    } catch (error) {
        console.error('Erreur annulation:', error);
        res.status(500).json({ error: 'Erreur lors de l\'annulation' });
    }
});

module.exports = router;

//===================== DÃ‰TAILS D'UNE TRANSACTION ====================//
router.get('/transaction/:numeroTransaction', authenticateToken, async (req, res) => {
    try {
        const { numeroTransaction } = req.params;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const transaction = user.transactions.find(
            t => t.numeroTransaction === numeroTransaction
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction introuvable' });
        }

        res.json({
            success: true,
            transaction
        });

    } catch (error) {
        console.error('Erreur dÃ©tails transaction:', error);
        res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
});

// ==================== ANNULER UNE TRANSACTION ====================
router.post('/annuler/:numeroTransaction', authenticateToken, async (req, res) => {
    try {
        const { numeroTransaction } = req.params;
        const { raison } = req.body;

        // Seuls les agents et distributeurs peuvent annuler
        if (!['Agent', 'Distributeur'].includes(req.user.typeUtilisateur)) {
            return res.status(403).json({ 
                error: 'Seuls les agents et distributeurs peuvent annuler des transactions' 
            });
        }

        // Trouver la transaction chez le distributeur ou l'utilisateur concernÃ©
        let userAvecTransaction;
        let transaction;

        if (req.user.typeUtilisateur === 'Distributeur') {
            // Le distributeur ne peut annuler que ses propres transactions
            userAvecTransaction = await User.findById(req.user._id);
            transaction = userAvecTransaction.transactions.find(
                t => t.numeroTransaction === numeroTransaction && 
                     !t.annulation.estAnnulee &&
                     ['Depot', 'Retrait'].includes(t.typeTransaction)
            );

            if (!transaction) {
                return res.status(404).json({ 
                    error: 'Transaction introuvable ou dÃ©jÃ  annulÃ©e' 
                });
            }
        } else {
            // Agent peut annuler toutes les transactions
            userAvecTransaction = await User.findOne({
                'transactions.numeroTransaction': numeroTransaction
            });

            if (!userAvecTransaction) {
                return res.status(404).json({ error: 'Transaction introuvable' });
            }

            transaction = userAvecTransaction.transactions.find(
                t => t.numeroTransaction === numeroTransaction
            );

            if (transaction.annulation.estAnnulee) {
                return res.status(400).json({ error: 'Transaction dÃ©jÃ  annulÃ©e' });
            }
        }

        // Trouver les comptes concernÃ©s pour le rollback
        const compteSource = transaction.compteSource;
        const compteDestination = transaction.compteDestination;

        // Rollback selon le type
        if (transaction.typeTransaction === 'Depot') {
            // Rembourser le distributeur, dÃ©biter le client
            const distributeur = await User.findOne({ 
                'comptes.numeroCompte': compteSource 
            });
            const client = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (distributeur && client) {
                distributeur.comptes[0].solde += transaction.montant;
                client.comptes[0].solde -= transaction.montant;
                distributeur.soldeBonus -= transaction.bonus;

                await distributeur.save();
                await client.save();
            }
        } else if (transaction.typeTransaction === 'Retrait') {
            // Rembourser le client, dÃ©biter le distributeur
            const client = await User.findOne({ 
                'comptes.numeroCompte': compteSource 
            });
            const distributeur = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (client && distributeur) {
                client.comptes[0].solde += transaction.montant;
                distributeur.comptes[0].solde -= transaction.montant;
                distributeur.soldeBonus -= transaction.bonus;

                await client.save();
                await distributeur.save();
            }
        } else if (transaction.typeTransaction === 'Transfert' && req.user.typeUtilisateur === 'Agent') {
            // Seulement les agents peuvent annuler les transferts
            const expediteur = await User.findOne({ 
                'comptes.numeroCompte': compteSource 
            });
            const destinataire = await User.findOne({ 
                'comptes.numeroCompte': compteDestination 
            });

            if (expediteur && destinataire) {
                expediteur.comptes[0].solde += transaction.montantTotal;
                destinataire.comptes[0].solde -= transaction.montant;

                await expediteur.save();
                await destinataire.save();
            }
        }

        // Marquer comme annulÃ©e
        transaction.annulation.estAnnulee = true;
        transaction.annulation.dateAnnulation = new Date();
        transaction.annulation.annuleeParEmail = req.user.email;
        transaction.annulation.raison = raison || 'Non spÃ©cifiÃ©e';
        transaction.statut = 'Annulee';

        await userAvecTransaction.save();

        res.json({
            success: true,
            message: 'Transaction annulÃ©e avec succÃ¨s',
            transaction: {
                numeroTransaction,
                typeTransaction: transaction.typeTransaction,
                montant: transaction.montant,
                dateAnnulation: transaction.annulation.dateAnnulation
            }
        });

    } catch (error) {
        console.error('Erreur annulation:', error);
        res.status(500).json({ error: 'Erreur lors de l\'annulation' });
    }
});

// ==================== CONSULTER SON SOLDE ====================
router.get('/solde', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('comptes soldeBonus typeUtilisateur');

        if (!user || !user.comptes || user.comptes.length === 0) {
            return res.status(404).json({ error: 'Compte introuvable' });
        }

        const compte = user.comptes[0];
        const response = {
            success: true,
            solde: compte.solde,
            numeroCompte: compte.numeroCompte,
            estBloque: compte.estBloque
        };

        if (user.typeUtilisateur === 'Distributeur') {
            response.soldeBonus = user.soldeBonus || 0;
        }

        res.json(response);

    } catch (error) {
        console.error('Erreur consultation solde:', error);
        res.status(500).json({ error: 'Erreur lors de la consultation' });
    }
});

// ==================== STATISTIQUES (Agent uniquement) ====================
router.get('/statistiques', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Agent') {
            return res.status(403).json({ 
                error: 'Seuls les agents peuvent consulter les statistiques' 
            });
        }

        const users = await User.find({}).select('transactions typeUtilisateur');

        let totalTransactions = 0;
        let totalDepots = 0;
        let totalRetraits = 0;
        let totalTransferts = 0;
        let volumeTotal = 0;
        let fraisTotal = 0;
        let commissionsTotal = 0;

        users.forEach(user => {
            user.transactions.forEach(t => {
                if (t.statut === 'Validee' && !t.annulation.estAnnulee) {
                    totalTransactions++;
                    volumeTotal += t.montant;
                    fraisTotal += t.frais || 0;
                    commissionsTotal += t.bonus || 0;

                    if (t.typeTransaction === 'Depot') totalDepots++;
                    if (t.typeTransaction === 'Retrait') totalRetraits++;
                    if (t.typeTransaction === 'Transfert') totalTransferts++;
                }
            });
        });

        res.json({
            success: true,
            statistiques: {
                totalTransactions,
                totalDepots,
                totalRetraits,
                totalTransferts,
                volumeTotal,
                fraisTotal,
                commissionsTotal
            }
        });

    } catch (error) {
        console.error('Erreur statistiques:', error);
        res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
});

// ==================== TRANSACTIONS ANNULABLES (Distributeur) ====================
router.get('/annulables', authenticateToken, async (req, res) => {
    try {
        if (req.user.typeUtilisateur !== 'Distributeur') {
            return res.status(403).json({ 
                error: 'Seuls les distributeurs peuvent voir leurs transactions annulables' 
            });
        }

        const distributeur = await User.findById(req.user._id).select('transactions email');

        const transactionsAnnulables = distributeur.transactions.filter(t => 
            t.statut === 'Validee' &&
            !t.annulation.estAnnulee &&
            ['Depot', 'Retrait'].includes(t.typeTransaction) &&
            t.acteurs.distributeurEmail === distributeur.email
        );

        res.json({
            success: true,
            transactions: transactionsAnnulables,
            count: transactionsAnnulables.length
        });

    } catch (error) {
        console.error('Erreur transactions annulables:', error);
        res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
});

module.exports = router;