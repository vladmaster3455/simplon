const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Tentative de connexion à MongoDB Atlas...');

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB Atlas (Database: simplon)');

    // Nettoyer la collection users
    const count = await User.countDocuments();
    console.log(`${count} documents trouvés dans la collection users`);
    
    await User.deleteMany({});
    console.log('Collection users nettoyée');

    // Mot de passe par défaut (à changer en production)
    const passwordHash = await bcrypt.hash('Passer123!', 12);

    // ========== 1. CRÉER L'AGENT PRINCIPAL ==========
    const agent = new User({
      nCarteIdentite: 'CNI2025001',
      nom: 'Senghor',
      prenom: 'Serge',
      email: 'agent@minibank.sn',
      tel: '771234567',
      adresse: 'Pikine, Dakar, Sénégal',
      dateNaissance: new Date('1990-01-15'),
      typeUtilisateur: 'Agent',
      motDePasse: passwordHash,
      estActif: true,
      dateCreation: new Date(),
      estSupprime: false,
      preferences: {
        notifications: true,
        theme: 'light',
        langue: 'fr'
      }
    });
    await agent.save();
    console.log('Agent créé: agent@minibank.sn');

    // ========== 2. CRÉER DES DISTRIBUTEURS ==========
    const distributeur1 = new User({
      nCarteIdentite: 'CNI2025002',
      nom: 'Diop',
      prenom: 'Fatou',
      email: 'fatou.diop@minibank.sn',
      tel: '772345678',
      adresse: 'Guédiawaye, Dakar',
      dateNaissance: new Date('1988-05-20'),
      typeUtilisateur: 'Distributeur',
      motDePasse: passwordHash,
      comptes: [{
        numeroCompte: `DIS${Date.now()}ABCD`,
        solde: 1000000, // 1 million FCFA
        estBloque: 'Actif',
        dateCreation: new Date(),
        createurEmail: agent.email
      }],
      soldeBonus: 15000,
      estActif: true,
      estSupprime: false,
      dateCreation: new Date()
    });
    await distributeur1.save();

    const distributeur2 = new User({
      nCarteIdentite: 'CNI2025003',
      nom: 'Ndiaye',
      prenom: 'Mamadou',
      email: 'mamadou.ndiaye@minibank.sn',
      tel: '773456789',
      adresse: 'Thiaroye, Dakar',
      dateNaissance: new Date('1985-11-10'),
      typeUtilisateur: 'Distributeur',
      motDePasse: passwordHash,
      comptes: [{
        numeroCompte: `DIS${Date.now() + 1}EFGH`,
        solde: 750000, // 750k FCFA
        estBloque: 'Actif',
        dateCreation: new Date(),
        createurEmail: agent.email
      }],
      soldeBonus: 8500,
      estActif: true,
      estSupprime: false,
      dateCreation: new Date()
    });
    await distributeur2.save();
    console.log('2 Distributeurs créés');

    // ========== 3. CRÉER DES CLIENTS ==========
    const client1 = new User({
      nCarteIdentite: 'CNI2025004',
      nom: 'Fall',
      prenom: 'Aïssatou',
      email: 'aissatou.fall@gmail.com',
      tel: '774567890',
      adresse: 'Parcelles Assainies, Dakar',
      dateNaissance: new Date('1995-03-25'),
      typeUtilisateur: 'Client',
      motDePasse: passwordHash,
      comptes: [{
        numeroCompte: `CLI${Date.now()}IJKL`,
        solde: 150000, // 150k FCFA
        estBloque: 'Actif',
        dateCreation: new Date(),
        createurEmail: agent.email
      }],
      estActif: true,
      estSupprime: false,
      dateCreation: new Date()
    });
    await client1.save();

    const client2 = new User({
      nCarteIdentite: 'CNI2025005',
      nom: 'Sarr',
      prenom: 'Ibrahima',
      email: 'ibrahima.sarr@gmail.com',
      tel: '775678901',
      adresse: 'Mbao, Dakar',
      dateNaissance: new Date('1992-07-14'),
      typeUtilisateur: 'Client',
      motDePasse: passwordHash,
      comptes: [{
        numeroCompte: `CLI${Date.now() + 2}MNOP`,
        solde: 85000, // 85k FCFA
        estBloque: 'Actif',
        dateCreation: new Date(),
        createurEmail: agent.email
      }],
      estActif: true,
      estSupprime: false,
      dateCreation: new Date()
    });
    await client2.save();

    const client3 = new User({
      nCarteIdentite: 'CNI2025006',
      nom: 'Sow',
      prenom: 'Mariama',
      email: 'mariama.sow@gmail.com',
      tel: '776789012',
      adresse: 'Grand Yoff, Dakar',
      dateNaissance: new Date('1998-09-30'),
      typeUtilisateur: 'Client',
      motDePasse: passwordHash,
      comptes: [{
        numeroCompte: `CLI${Date.now() + 3}QRST`,
        solde: 42000, // 42k FCFA
        estBloque: 'Actif',
        dateCreation: new Date(),
        createurEmail: agent.email
      }],
      estActif: true,
      estSupprime: false,
      dateCreation: new Date()
    });
    await client3.save();
    console.log('3 Clients créés');

    // ========== 4. CRÉER DES TRANSACTIONS D'EXEMPLE ==========
    
    // Transaction 1: Dépôt (Distributeur -> Client)
    const transactionDepot = {
      numeroTransaction: `TRX${Date.now()}DEP01`,
      dateTransaction: new Date(),
      typeTransaction: 'Depot',
      montant: 50000,
      frais: 0,
      bonus: 500, // 1% de commission pour le distributeur
      montantTotal: 50000,
      compteSource: distributeur1.comptes[0].numeroCompte,
      compteDestination: client1.comptes[0].numeroCompte,
      acteurs: {
        clientEmail: client1.email,
        distributeurEmail: distributeur1.email
      },
      statut: 'Validee',
      dateValidation: new Date(),
      valideParEmail: distributeur1.email,
      details: {
        description: 'Dépôt en espèces',
        adresseIP: '196.1.95.10',
        deviceInfo: 'Mobile App Android'
      },
      annulation: {
        estAnnulee: false
      }
    };

    distributeur1.transactions.push(transactionDepot);
    client1.transactions.push(transactionDepot);
    distributeur1.comptes[0].solde -= 50000;
    client1.comptes[0].solde += 50000;
    distributeur1.soldeBonus += 500;

    // Transaction 2: Transfert (Client -> Client)
    const transactionTransfert = {
      numeroTransaction: `TRX${Date.now() + 1}TRF01`,
      dateTransaction: new Date(Date.now() - 3600000), // Il y a 1 heure
      typeTransaction: 'Transfert',
      montant: 25000,
      frais: 500, // 2% de frais
      bonus: 0,
      montantTotal: 25500,
      compteSource: client1.comptes[0].numeroCompte,
      compteDestination: client2.comptes[0].numeroCompte,
      acteurs: {
        clientEmail: client1.email
      },
      statut: 'Validee',
      dateValidation: new Date(Date.now() - 3600000),
      valideParEmail: client1.email,
      details: {
        description: `Transfert vers ${client2.prenom} ${client2.nom}`,
        adresseIP: '196.1.95.15',
        deviceInfo: 'Mobile App iOS'
      },
      annulation: {
        estAnnulee: false
      }
    };

    client1.transactions.push(transactionTransfert);
    client2.transactions.push(transactionTransfert);
    client1.comptes[0].solde -= 25500;
    client2.comptes[0].solde += 25000;

    // Transaction 3: Crédit Agent -> Distributeur
    const transactionCredit = {
      numeroTransaction: `TRX${Date.now() + 2}CRD01`,
      dateTransaction: new Date(Date.now() - 86400000), // Il y a 1 jour
      typeTransaction: 'Credit_Agent',
      montant: 500000,
      frais: 0,
      bonus: 0,
      montantTotal: 500000,
      compteSource: 'AGENT_SYSTEM',
      compteDestination: distributeur2.comptes[0].numeroCompte,
      acteurs: {
        agentEmail: agent.email,
        distributeurEmail: distributeur2.email
      },
      statut: 'Validee',
      dateValidation: new Date(Date.now() - 86400000),
      valideParEmail: agent.email,
      details: {
        description: `Crédit par Agent ${agent.prenom} ${agent.nom}`,
        adresseIP: '196.1.95.1',
        deviceInfo: 'Desktop Chrome'
      },
      annulation: {
        estAnnulee: false
      }
    };

    agent.transactions.push(transactionCredit);
    distributeur2.transactions.push(transactionCredit);

    // Sauvegarder toutes les modifications
    await distributeur1.save();
    await client1.save();
    await client2.save();
    await agent.save();
    await distributeur2.save();

    console.log('3 transactions créées');

    // ========== RÉSUMÉ ==========
    console.log('\n===========================================');
    console.log('DONNÉES INSÉRÉES AVEC SUCCÈS !');
    console.log('===========================================');
    console.log('\nDATABASE: simplon');
    console.log('COLLECTION: users');
    console.log(`DOCUMENTS CRÉÉS: ${await User.countDocuments()}`);
    
    console.log('\n--- IDENTIFIANTS DE TEST ---');
    console.log('\nAGENT:');
    console.log('  Email: agent@minibank.sn');
    console.log('  Password: Passer123!');
    
    console.log('\nDISTRIBUTEUR 1:');
    console.log('  Email: fatou.diop@minibank.sn');
    console.log('  Password: Passer123!');
    console.log(`  Solde: ${distributeur1.comptes[0].solde} FCFA`);
    console.log(`  Bonus: ${distributeur1.soldeBonus} FCFA`);
    
    console.log('\nDISTRIBUTEUR 2:');
    console.log('  Email: mamadou.ndiaye@minibank.sn');
    console.log('  Password: Passer123!');
    console.log(`  Solde: ${distributeur2.comptes[0].solde} FCFA`);
    
    console.log('\nCLIENT 1:');
    console.log('  Email: aissatou.fall@gmail.com');
    console.log('  Password: Passer123!');
    console.log(`  Solde: ${client1.comptes[0].solde} FCFA`);
    
    console.log('\nCLIENT 2:');
    console.log('  Email: ibrahima.sarr@gmail.com');
    console.log('  Password: Passer123!');
    console.log(`  Solde: ${client2.comptes[0].solde} FCFA`);
    
    console.log('\nCLIENT 3:');
    console.log('  Email: mariama.sow@gmail.com');
    console.log('  Password: Passer123!');
    console.log(`  Solde: ${client3.comptes[0].solde} FCFA`);
    
    console.log('\n===========================================\n');

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('ERREUR lors de l\'insertion:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  }
};

seedData();