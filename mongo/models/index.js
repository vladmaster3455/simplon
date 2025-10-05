const mongoose = require('mongoose');

// Schéma Utilisateur avec Archivage
const userSchema = new mongoose.Schema({
  nCarteIdentite: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  tel: { type: String, required: true, unique: true }, 
  adresse: String,
  dateNaissance: {
    type: Date,
    validate: {
      validator: function(date) {
        if (!date) return true; // Date optionnelle
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        const dayDiff = today.getDate() - date.getDate();
        
        let actualAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          actualAge--;
        }
        
        return actualAge >= 18 && actualAge <= 150;
      },
      message: 'L\'âge doit être entre 18 et 150 ans'
    }
  },
  photo: String,
  
  typeUtilisateur: { 
    type: String, 
    enum: ['Client', 'Distributeur', 'Agent'], 
    required: true 
  },
  motDePasse: { type: String, required: true },
  pwdTemporaire: { type: Boolean, default: false },
  estActif: { type: Boolean, default: true },
  dateCreation: { type: Date, default: Date.now },
  dateDerniereConnexion: Date,
  
  // ✅ NOUVEAUX CHAMPS POUR L'ARCHIVAGE (Soft Delete)
  estSupprime: { 
    type: Boolean, 
    default: false,
    select: false  // Ne pas retourner par défaut dans les requêtes
  },
  dateSuppression: { 
    type: Date,
    select: false 
  },
  supprimeParEmail: { 
    type: String,
    select: false 
  },
  
  comptes: [{
    numeroCompte: String,
    solde: { type: Number, default: 0 },
    estBloque: { type: String, enum: ['Actif', 'Bloqué'], default: 'Actif' },
    dateCreation: { type: Date, default: Date.now },
    createurEmail: String,
    qrCode: String
  }],
  
  soldeBonus: Number,
  transactions: [{
    numeroTransaction: String,
    dateTransaction: { type: Date, default: Date.now },
    typeTransaction: String,
    montant: Number,
    frais: Number,
    bonus: Number,
    montantTotal: Number,
    compteSource: String,
    compteDestination: String,
    acteurs: {
      clientEmail: String,
      distributeurEmail: String,
      agentEmail: String
    },
    statut: String,
    dateValidation: Date,
    valideParEmail: String,
    annulation: {
      estAnnulee: { type: Boolean, default: false },
      dateAnnulation: Date,
      annuleeParEmail: String,
      raison: String
    },
    details: {
      description: String,
      adresseIP: String,
      deviceInfo: String
    }
  }],
  
  passwordReset: {
    token: String,
    expiresAt: Date,
    used: Boolean,
    createdAt: Date
  },
  
  activeTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    deviceInfo: String
  }],
  
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' },
    langue: { type: String, default: 'fr' }
  }
});

// ============================================
// MÉTHODES D'INSTANCE POUR L'ARCHIVAGE
// ============================================

// ✅ Archiver un utilisateur (Soft Delete)
userSchema.methods.softDelete = async function(agentEmail) {
  this.estSupprime = true;
  this.dateSuppression = new Date();
  this.supprimeParEmail = agentEmail;
  return await this.save();
};

// ✅ Restaurer un utilisateur archivé
userSchema.methods.restore = async function() {
  this.estSupprime = false;
  this.dateSuppression = null;
  this.supprimeParEmail = null;
  return await this.save();
};

// ============================================
// MÉTHODES STATIQUES POUR L'ARCHIVAGE MULTIPLE
// ============================================

// ✅ Archiver plusieurs utilisateurs
userSchema.statics.softDeleteMany = async function(userIds, agentEmail) {
  return await this.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        estSupprime: true,
        dateSuppression: new Date(),
        supprimeParEmail: agentEmail
      }
    }
  );
};

// ✅ Restaurer plusieurs utilisateurs
userSchema.statics.restoreMany = async function(userIds) {
  return await this.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        estSupprime: false,
        dateSuppression: null,
        supprimeParEmail: null
      }
    }
  );
};

// ✅ Récupérer uniquement les utilisateurs NON archivés
userSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, estSupprime: false });
};

// ✅ Récupérer uniquement les utilisateurs ARCHIVÉS
userSchema.statics.findDeleted = function(filter = {}) {
  return this.find({ ...filter, estSupprime: true })
    .select('+estSupprime +dateSuppression +supprimeParEmail')
    .setOptions({ includeDeleted: true }); // ← AJOUTER CETTE LIGNE
};

// ============================================
// MIDDLEWARE : Exclure automatiquement les archivés
// ============================================

// Par défaut, toutes les requêtes find() excluent les utilisateurs archivés
userSchema.pre(/^find/, function(next) {
  // Sauf si on demande explicitement les archivés avec .select('+estSupprime')
  if (!this.getOptions().includeDeleted) {
    this.where({ estSupprime: { $ne: true } });
  }
  next();
});

// Modèle
const User = mongoose.model('User', userSchema);

module.exports = {
  User
};