# 🏦 MiniBank - Application Bancaire Complète

Application web de gestion bancaire avec React (frontend) et Express/MongoDB (backend).

## 📋 Structure du projet

```
projet/
├── mongo/                    # Backend API (Node.js + Express + MongoDB)
│   ├── models/              # Modèles Mongoose
│   ├── routes/              # Routes de l'API
│   ├── server.js            # Point d'entrée du serveur
│   ├── package.json         # Dépendances backend
│   └── .env.example         # Template de configuration
│
├── src/                     # Frontend React
│   ├── components/          # Composants réutilisables
│   ├── pages/              # Pages de l'application
│   ├── config/             # Configuration API
│   └── App.js              # Composant racine
│
├── public/                  # Assets statiques
├── package.json            # Dépendances frontend
├── .env.example            # Template configuration frontend
├── .gitignore              # Fichiers à ignorer
└── README.md               # Ce fichier
```

## 🚀 Technologies utilisées

### Backend
- **Node.js** & **Express** - Serveur API REST
- **MongoDB Atlas** - Base de données cloud
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification sécurisée
- **Bcrypt** - Hashage des mots de passe
- **Multer** - Gestion des uploads de fichiers

### Frontend
- **React 18** - Bibliothèque UI
- **Material-UI (MUI)** - Framework de composants
- **React Router v6** - Navigation
- **Fetch API** - Requêtes HTTP

## 📦 Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/vladmaster3455/simplon.git
cd simplon/projet
```

### 2. Installer le Backend

```bash
cd mongo
npm install
cp .env.example .env
# Éditez .env avec vos credentials MongoDB Atlas
npm start
```

Le backend démarre sur `http://localhost:5000`

### 3. Installer le Frontend

```bash
# Depuis la racine projet/
npm install
cp .env.example .env
# Vérifiez que REACT_APP_API_URL pointe vers votre backend
npm start
```

Le frontend démarre sur `http://localhost:3000`

## 🌐 Déploiement en production

### Backend sur Render

1. Créez un compte sur [render.com](https://render.com)
2. **New + → Web Service**
3. Connectez votre repo GitHub
4. Configuration :
   - **Name** : `minibank-api`
   - **Region** : Europe (Frankfurt)
   - **Branch** : `main`
   - **Root Directory** : `mongo` ⚠️
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`

5. **Variables d'environnement** :
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=votre_cle_secrete
NODE_ENV=production
API_PREFIX=/serge
TOKEN_EXPIRY=24h
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://votre-app.vercel.app
```

### Frontend sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com)
2. **Add New → Project**
3. Importez votre repo GitHub
4. Configuration :
   - **Project Name** : `minibank-app`
   - **Framework Preset** : Create React App
   - **Root Directory** : `.` (racine)
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`

5. **Variables d'environnement** :
```
REACT_APP_API_URL=https://minibank-api.onrender.com/serge
REACT_APP_TIMEOUT=30000
```

### 🔗 Connexion Backend/Frontend

Après déploiement :
1. Copiez l'URL Vercel (ex: `https://minibank-app.vercel.app`)
2. Retournez sur Render → Environment
3. Ajoutez dans `CORS_ORIGIN` :
```
https://minibank-app.vercel.app,https://minibank-app-*.vercel.app
```

## 📡 API Endpoints

### Authentification
- `POST /serge/auth/login` - Connexion
- `POST /serge/auth/logout` - Déconnexion
- `GET /serge/auth/profile` - Récupérer le profil
- `PUT /serge/auth/profile` - Mettre à jour le profil

### Utilisateurs
- `GET /serge/users` - Liste des utilisateurs
- `GET /serge/users/:id` - Détails d'un utilisateur
- `POST /serge/users/clients` - Créer un client
- `POST /serge/users/distributeurs` - Créer un distributeur
- `PUT /serge/users/:id` - Modifier un utilisateur
- `DELETE /serge/users/:id` - Archiver un utilisateur
- `PATCH /serge/users/:id/restore` - Restaurer un utilisateur
- `GET /serge/users/deleted/list` - Utilisateurs archivés

### Transactions
- `POST /serge/transactions/depot` - Effectuer un dépôt
- `POST /serge/transactions/retrait` - Effectuer un retrait
- `POST /serge/transactions/transfert` - Effectuer un transfert
- `GET /serge/transactions/historique` - Historique
- `POST /serge/transactions/annuler/:numero` - Annuler une transaction

## 👥 Types d'utilisateurs

### Agent
- Crée des clients et distributeurs
- Crédite les distributeurs
- Voir tous les utilisateurs
- Accès aux statistiques
- Annule toutes les transactions

### Distributeur
- Effectue des dépôts vers les clients
- Effectue des retraits depuis les clients
- Reçoit des commissions (1% sur dépôts)
- Annule ses propres transactions (48h)

### Client
- Effectue des transferts vers d'autres clients
- Consulte son solde et historique

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- Authentification JWT (expiration 24h)
- CORS configuré pour domaines autorisés
- Soft delete pour préserver l'historique
- Validation des permissions par type d'utilisateur

## 🧪 Données de test

Pour créer des utilisateurs de test :

```bash
cd mongo
node test.js
```

Cela créera :
- 1 Agent
- 2 Distributeurs
- 3 Clients
- Quelques transactions d'exemple

## 🐛 Dépannage

### Erreur CORS
**Symptôme** : `Access to fetch has been blocked by CORS policy`

**Solution** : Vérifiez que l'URL Vercel est dans `CORS_ORIGIN` sur Render

### MongoDB non connecté
**Symptôme** : `MongoNetworkError`

**Solution** : 
- Vérifiez `MONGODB_URI` dans les variables d'environnement
- Autorisez l'IP de Render dans MongoDB Atlas (ou `0.0.0.0/0` pour tous)

### Routes 404
**Symptôme** : `404 Not Found` sur les routes API

**Solution** : Vérifiez que `API_PREFIX=/serge` est défini sur Render

### Photos non affichées
**Symptôme** : Images cassées

**Note** : Render Free tier a un système de fichiers éphémère. Pour la production, utilisez :
- Cloudinary
- AWS S3
- Render Disk (payant)

## 📝 Variables d'environnement requises

### Backend (.env dans mongo/)
```properties
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=production
API_PREFIX=/serge
TOKEN_EXPIRY=24h
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://...
```

### Frontend (.env à la racine)
```properties
REACT_APP_API_URL=https://minibank-api.onrender.com/serge
REACT_APP_TIMEOUT=30000
```

## 🔑 Générer une clé JWT sécurisée

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📄 Licence

MIT

## 👨‍💻 Auteur

MiniBank Team

## 🌐 Liens

- **GitHub** : https://github.com/vladmaster3455/simplon
- **Frontend (Vercel)** : À ajouter après déploiement
- **Backend (Render)** : À ajouter après déploiement