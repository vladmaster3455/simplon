# 🏦 MiniBank API - Backend

API REST pour le système bancaire MiniBank avec MongoDB et Express.

## 📋 Prérequis

- Node.js >= 16.0.0
- MongoDB Atlas (ou MongoDB local)
- npm ou yarn

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier .env.example en .env et configurer
cp .env.example .env

# Peupler la base de données avec des données de test
node test.js

# Démarrer le serveur
npm start

# Ou en mode développement avec nodemon
npm run dev
```

## 🔧 Configuration

Créez un fichier `.env` à la racine du dossier avec:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
JWT_SECRET=votre_cle_secrete_unique
API_PREFIX=/serge
TOKEN_EXPIRY=24h
BCRYPT_ROUNDS=12
```

## 📡 Endpoints API

### Authentification

- **POST** `/serge/register` - Créer un agent (authentification requise)
- **POST** `/serge/login` - Connexion
- **POST** `/serge/logout` - Déconnexion
- **GET** `/serge/profile` - Récupérer le profil
- **PUT** `/serge/profile` - Mettre à jour le profil

### Utilisateurs

- **GET** `/serge/users` - Liste des utilisateurs actifs
- **GET** `/serge/users/:id` - Détails d'un utilisateur
- **POST** `/serge/clients` - Créer un client
- **POST** `/serge/distributeurs` - Créer un distributeur
- **PUT** `/serge/users/:id` - Modifier un utilisateur
- **DELETE** `/serge/users/:id` - Archiver un utilisateur (soft delete)
- **PATCH** `/serge/users/:id/restore` - Restaurer un utilisateur archivé
- **GET** `/serge/users/deleted/list` - Liste des utilisateurs archivés
- **DELETE** `/serge/users/bulk` - Archiver plusieurs utilisateurs
- **PATCH** `/serge/users/bulk/restore` - Restaurer plusieurs utilisateurs

### Transactions

- **POST** `/serge/transactions/depot` - Effectuer un dépôt
- **POST** `/serge/transactions/retrait` - Effectuer un retrait
- **POST** `/serge/transactions/transfert` - Effectuer un transfert
- **GET** `/serge/transactions/historique` - Historique des transactions
- **GET** `/serge/transactions/transaction/:numero` - Détails d'une transaction
- **POST** `/serge/transactions/annuler/:numero` - Annuler une transaction
- **GET** `/serge/transactions/solde` - Consulter le solde
- **GET** `/serge/transactions/statistiques` - Statistiques (Agent uniquement)

## 👥 Types d'utilisateurs

### Agent
- Peut créer des clients et distributeurs
- Peut voir tous les utilisateurs
- Peut archiver/restaurer des utilisateurs
- Accès aux statistiques

### Distributeur
- Peut effectuer des dépôts vers les clients
- Peut effectuer des retraits depuis les clients
- Reçoit des commissions (1% sur les dépôts)

### Client
- Peut effectuer des transferts vers d'autres clients
- Peut consulter son solde et historique

## 🗄️ Structure de la base de données

### Collection: users

```javascript
{
  nCarteIdentite: String,
  nom: String,
  prenom: String,
  email: String,
  tel: String,
  adresse: String,
  dateNaissance: Date,
  photo: String,
  typeUtilisateur: 'Agent' | 'Client' | 'Distributeur',
  motDePasse: String (hashé),
  estActif: Boolean,
  estSupprime: Boolean,
  dateSuppression: Date,
  supprimeParEmail: String,
  comptes: [{
    numeroCompte: String,
    solde: Number,
    estBloque: 'Actif' | 'Bloqué',
    dateCreation: Date
  }],
  transactions: [...]
}
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- Authentification JWT
- Middleware de vérification des tokens
- Soft delete pour préserver l'historique
- Validation des permissions par type d'utilisateur

## 📦 Dépendances principales

- **express** - Framework web
- **mongoose** - ODM MongoDB
- **bcryptjs** - Hashage des mots de passe
- **jsonwebtoken** - Authentification JWT
- **cors** - Gestion CORS
- **multer** - Upload de fichiers
- **dotenv** - Variables d'environnement

## 🧪 Tests

```bash
# Peupler la base avec des données de test
node test.js
```

Cela créera:
- 1 Agent
- 2 Distributeurs
- 3 Clients
- 3 Transactions d'exemple

## 📝 Logs

Le serveur affiche:
- Connexion MongoDB réussie/échouée
- Port d'écoute
- URL de l'API
- Erreurs détaillées dans la console

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifiez votre `MONGODB_URI` dans `.env`
- Vérifiez que votre IP est autorisée dans MongoDB Atlas
- Vérifiez vos identifiants

### Port déjà utilisé
- Changez le `PORT` dans `.env`
- Ou arrêtez le processus utilisant le port 5000

### Token invalide
- Le token JWT expire après 24h par défaut
- Reconnectez-vous pour obtenir un nouveau token

## 📄 Licence

MIT
